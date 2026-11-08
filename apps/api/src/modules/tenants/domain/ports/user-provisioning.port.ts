export interface ProvisionedUserResult {
  id: string;
  email: string;
  role: string;
  institutionId: string;
  fullName: string;
}

export interface UserProvisioningPort {
  provisionInstitutionUsers(
    institutionId: string,
    schoolAdminEmail: string,
    kioskEmail: string,
  ): Promise<{
    schoolAdmin: ProvisionedUserResult;
    kiosk: ProvisionedUserResult;
  }>;
}

export const USER_PROVISIONING_PORT = Symbol('USER_PROVISIONING_PORT');
