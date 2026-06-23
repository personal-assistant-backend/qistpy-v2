// Enums shared between backend and frontend.
// Keep these in sync with prisma/schema.prisma enums.
// Reason: Angular can't import from Prisma client directly; duplicating here
// keeps the contract explicit and serializable over the wire.

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  ADMIN = 'ADMIN',
}

export enum VendorStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  ARCHIVED = 'ARCHIVED',
}

export enum InstallmentRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ADVANCE_PAID = 'ADVANCE_PAID',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DEFAULTED = 'DEFAULTED',
}

export enum InstallmentScheduleStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  WAIVED = 'WAIVED',
}

export enum PaymentStatus {
  INITIATED = 'INITIATED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PENDING_REVIEW = 'PENDING_REVIEW', // for manual bank transfer screenshots
}

export enum PaymentMethod {
  JAZZCASH = 'JAZZCASH',
  EASYPAISA = 'EASYPAISA',
  BANK_TRANSFER = 'BANK_TRANSFER',
  RAAST = 'RAAST',
}

export enum PayoutStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  REJECTED = 'REJECTED',
}

export enum KycStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum NotificationType {
  OTP = 'OTP',
  INSTALLMENT_REQUEST_APPROVED = 'INSTALLMENT_REQUEST_APPROVED',
  INSTALLMENT_REQUEST_REJECTED = 'INSTALLMENT_REQUEST_REJECTED',
  ADVANCE_CONFIRMED = 'ADVANCE_CONFIRMED',
  INSTALLMENT_DUE_SOON = 'INSTALLMENT_DUE_SOON',
  INSTALLMENT_OVERDUE = 'INSTALLMENT_OVERDUE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  VENDOR_NEW_REQUEST = 'VENDOR_NEW_REQUEST',
  VENDOR_PAYOUT_APPROVED = 'VENDOR_PAYOUT_APPROVED',
  KYC_APPROVED = 'KYC_APPROVED',
  KYC_REJECTED = 'KYC_REJECTED',
  BROADCAST = 'BROADCAST',
}
