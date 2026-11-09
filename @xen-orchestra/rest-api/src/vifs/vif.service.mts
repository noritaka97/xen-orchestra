import { createLogger } from '@xen-orchestra/log'
import type { Xapi, XenApiVif, XoVif } from '@vates/types'

import type { RestApi } from '../rest-api/rest-api.mjs'

const log = createLogger('xo:rest-api:vif-service')

type VifSettings = Parameters<Xapi['VIF_create']>[0]

export class VifService {
  #restApi: RestApi

  constructor(restApi: RestApi) {
    this.#restApi = restApi
  }

  async #finalizeVif(xapi: Xapi, vifRef: XenApiVif['$ref'], ipAddresses: string[]): Promise<XoVif['id']> {
    const vifId = (await xapi.barrier<XenApiVif>(vifRef)).uuid as XoVif['id']
    await this.#restApi.xoApp.allocIpAddresses(vifId, ipAddresses)
    return vifId
  }

  /**
   * XAPI cannot modify a MAC address: the VIF is destroyed and recreated with the same settings.
   * If the recreation fails, the VIF is restored with its original MAC address and the error is rethrown.
   *
   * @returns the ID of the recreated VIF, unchanged if the MAC address is already the requested one
   */
  async changeMac(id: XoVif['id'], mac: string): Promise<XoVif['id']> {
    const vif = this.#restApi.getObject<XoVif>(id, 'VIF')
    if (mac.toLowerCase() === vif.MAC.toLowerCase()) {
      return id
    }

    const xapi = this.#restApi.xoApp.getXapi(id)
    const xapiVif = this.#restApi.getXapiObject<XoVif>(id, 'VIF')
    const ipAddresses = vif.allowedIpv4Addresses.concat(vif.allowedIpv6Addresses)

    // keep every setting: other_config holds the SDN traffic rules and ethtool-tx
    const settings: VifSettings = {
      currently_attached: xapiVif.currently_attached,
      device: xapiVif.device,
      ipv4_allowed: xapiVif.ipv4_allowed,
      ipv6_allowed: xapiVif.ipv6_allowed,
      locking_mode: xapiVif.locking_mode,
      MTU: xapiVif.MTU,
      network: xapiVif.network,
      other_config: xapiVif.other_config,
      qos_algorithm_params: xapiVif.qos_algorithm_params,
      qos_algorithm_type: xapiVif.qos_algorithm_type,
      VM: xapiVif.VM,
    }

    // released before the deletion: the IP pools need the VIF to find its network
    await this.#restApi.xoApp.allocIpAddresses(id, undefined, ipAddresses)
    try {
      await xapi.deleteVif(id)
    } catch (error) {
      await this.#restApi.xoApp.allocIpAddresses(id, ipAddresses)
      throw error
    }

    let vifRef: XenApiVif['$ref']
    try {
      vifRef = await xapi.VIF_create(settings, { MAC: mac })
    } catch (error) {
      try {
        const restoredVifRef = await xapi.VIF_create(settings, { MAC: xapiVif.MAC })
        const restoredVifId = await this.#finalizeVif(xapi, restoredVifRef, ipAddresses)
        log.warn('failed to change the MAC address, the VIF has been restored', { error, vifId: id, restoredVifId })
      } catch (restoreError) {
        log.error('failed to change the MAC address and to restore the VIF', {
          error: restoreError,
          vifId: id,
          MAC: xapiVif.MAC,
          settings,
        })
      }
      throw error
    }

    return this.#finalizeVif(xapi, vifRef, ipAddresses)
  }
}
