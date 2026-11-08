import { HttpException, HttpStatus } from '@nestjs/common';
import { DOMAIN_ERROR_CODES, type DomainErrorCode } from '@cambiazo/shared';

export class DomainException extends HttpException {
  public readonly code: DomainErrorCode;

  constructor(
    code: DomainErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: unknown,
  ) {
    super(
      {
        statusCode: status,
        error: code,
        code,
        message,
        details,
      },
      status,
    );
    this.code = code;
  }
}

export class TenantMismatchException extends DomainException {
  constructor(message = 'Cross-institution access is forbidden') {
    super(DOMAIN_ERROR_CODES.TENANT_MISMATCH, message, HttpStatus.FORBIDDEN);
  }
}

export class UnauthorizedRoleException extends DomainException {
  constructor(message = 'User role is not authorized for this operation') {
    super(DOMAIN_ERROR_CODES.UNAUTHORIZED_ROLE, message, HttpStatus.FORBIDDEN);
  }
}

export class ParentalConsentRequiredException extends DomainException {
  constructor(message = 'Student cannot operate without parental consent (Ley 25.326)') {
    super(DOMAIN_ERROR_CODES.PARENTAL_CONSENT_REQUIRED, message, HttpStatus.FORBIDDEN);
  }
}

export class ParentalConsentRevokedException extends DomainException {
  constructor(message = 'Student consent has been revoked (Ley 25.326)') {
    super(DOMAIN_ERROR_CODES.PARENTAL_CONSENT_REVOKED, message, HttpStatus.FORBIDDEN);
  }
}

export class AccountPausedException extends DomainException {
  constructor(message = 'Student account is suspended or paused') {
    super(DOMAIN_ERROR_CODES.ACCOUNT_PAUSED, message, HttpStatus.FORBIDDEN);
  }
}

export class InvalidInvitationCodeException extends DomainException {
  constructor(message = 'Invitation code is invalid, expired, or has exceeded max uses') {
    super(DOMAIN_ERROR_CODES.INVALID_INVITATION_CODE, message, HttpStatus.BAD_REQUEST);
  }
}

export class ImmutableRecordViolationException extends DomainException {
  constructor(message = 'Parental consent records are immutable under Ley 25.326') {
    super(DOMAIN_ERROR_CODES.IMMUTABLE_RECORD_VIOLATION, message, HttpStatus.CONFLICT);
  }
}
