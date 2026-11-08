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
  constructor(message = 'Parental consent and ledger records are strictly immutable') {
    super(DOMAIN_ERROR_CODES.IMMUTABLE_RECORD_VIOLATION, message, HttpStatus.CONFLICT);
  }
}

export class ProhibitedTransferException extends DomainException {
  constructor(message = 'Student-to-student balance transfers and cash withdrawals are strictly prohibited') {
    super(DOMAIN_ERROR_CODES.PROHIBITED_TRANSFER, message, HttpStatus.FORBIDDEN);
  }
}

export class UnbalancedTransactionException extends DomainException {
  constructor(message = 'Ledger transaction is unbalanced: sum of debits must equal sum of credits') {
    super(DOMAIN_ERROR_CODES.UNBALANCED_TRANSACTION, message, HttpStatus.BAD_REQUEST);
  }
}

export class InsufficientFundsException extends DomainException {
  constructor(message = 'Insufficient funds for this transaction') {
    super(DOMAIN_ERROR_CODES.INSUFFICIENT_FUNDS, message, HttpStatus.BAD_REQUEST);
  }
}

export class CategoryBlockedException extends DomainException {
  constructor(category: string, message = `Product category ${category} is blocked by parental controls`) {
    super(DOMAIN_ERROR_CODES.CATEGORY_BLOCKED, message, HttpStatus.FORBIDDEN, { category });
  }
}

export class DailyLimitExceededException extends DomainException {
  constructor(message = 'Purchase exceeds daily spending limit configured by parent') {
    super(DOMAIN_ERROR_CODES.DAILY_LIMIT_EXCEEDED, message, HttpStatus.FORBIDDEN);
  }
}

export class WeeklyLimitExceededException extends DomainException {
  constructor(message = 'Purchase exceeds weekly spending limit configured by parent') {
    super(DOMAIN_ERROR_CODES.WEEKLY_LIMIT_EXCEEDED, message, HttpStatus.FORBIDDEN);
  }
}

export class ProductNotFoundException extends DomainException {
  constructor(productId: string, message = `Product ${productId} was not found`) {
    super(DOMAIN_ERROR_CODES.PRODUCT_NOT_FOUND, message, HttpStatus.NOT_FOUND, { productId });
  }
}

export class InsufficientStockException extends DomainException {
  constructor(productId: string, message = `Product ${productId} has insufficient stock`) {
    super(DOMAIN_ERROR_CODES.INSUFFICIENT_STOCK, message, HttpStatus.BAD_REQUEST, { productId });
  }
}

export class QrTokenExpiredException extends DomainException {
  constructor(message = 'Payment QR token is invalid or has expired (120s TTL)') {
    super(DOMAIN_ERROR_CODES.QR_TOKEN_EXPIRED, message, HttpStatus.BAD_REQUEST);
  }
}

export class AccountNotFoundException extends DomainException {
  constructor(message = 'Wallet or ledger account not found') {
    super(DOMAIN_ERROR_CODES.ACCOUNT_NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }
}

export class WithdrawalNotPermittedException extends DomainException {
  constructor(message = 'Withdrawal is not permitted') {
    super(DOMAIN_ERROR_CODES.WITHDRAWAL_NOT_PERMITTED, message, HttpStatus.FORBIDDEN);
  }
}

