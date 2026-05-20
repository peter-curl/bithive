;; Hive - Bitcoin-native micro reward protocol on Stacks
;; Version: 1.0.0
;;
;; Hive is a decentralized micro-reward protocol built on the
;; Stacks blockchain.
;;
;; It enables users to accrue STX rewards with optional messages to
;; creators, developers, and contributors.
;;
;; The protocol records reward activity, tracks user statistics,
;; and collects a small protocol fee to support sustainability.
;;
;; Hive provides transparent on-chain metrics such as:
;; - Total accruals across the protocol
;; - Total transaction volume
;; - User reward statistics
;; - Protocol revenue accumulation
;;
;; The goal of Hive is to create a simple and transparent way
;; to support contributors using Bitcoin-secured micro-payments.

;; ---------------------------------------------------------
;; Constants
;; ---------------------------------------------------------

;; The principal that deploys the contract becomes the protocol owner
(define-constant contract-owner tx-sender)

;; Error codes
(define-constant err-owner-only (err u100))
(define-constant err-invalid-amount (err u101))
(define-constant err-insufficient-balance (err u102))
(define-constant err-transfer-failed (err u103))
(define-constant err-not-found (err u104))

;; ---------------------------------------------------------
;; Fee Configuration
;; ---------------------------------------------------------

;; 50 basis points = 0.5%
(define-constant fee-basis-points u50)
(define-constant basis-points-divisor u10000)

;; ---------------------------------------------------------
;; Global Protocol Statistics
;; ---------------------------------------------------------

;; Total number of accruals
(define-data-var total-accruals uint u0)

;; Total volume processed through the protocol
(define-data-var total-volume uint u0)

;; Total fees accumulated by the protocol
(define-data-var protocol-revenue uint u0)

;; ---------------------------------------------------------
;; Data Maps
;; ---------------------------------------------------------

;; Accrual registry
(define-map accruals
    { accrual-id: uint }
    {
        sender: principal,
        recipient: principal,
        amount: uint,
        message: (string-utf8 280),
        accrual-height: uint
    }
)

;; ---------------------------------------------------------
;; User Activity Tracking
;; ---------------------------------------------------------

;; Number of accruals a user has sent
(define-map user-accrual-count principal uint)

;; Number of accruals a user has received
(define-map user-received-count principal uint)

;; Total amount a user has accrued to others
(define-map user-total-accrued principal uint)

;; Total amount a user has received
(define-map user-total-received principal uint)

;; ---------------------------------------------------------
;; Private Functions
;; ---------------------------------------------------------

;; calculate-fee
;; Calculates the protocol fee
(define-private (calculate-fee (amount uint))
    (/ (* amount fee-basis-points) basis-points-divisor)
)

;; ---------------------------------------------------------
;; Public Functions
;; ---------------------------------------------------------

;; hive
;;
;; Core protocol function.
;;
;; Allows a user to accrue STX rewards to another user
;; with an optional message.
;;
;; Process:
;; 1. Validate parameters
;; 2. Calculate protocol fee
;; 3. Transfer net amount to recipient
;; 4. Transfer fee to protocol owner
;; 5. Record accrual
;; 6. Update user statistics
;; 7. Update protocol statistics
;;
;; The protocol owner does not pay fees.

(define-public (hive-reward
    (recipient principal)
    (amount uint)
    (message (string-utf8 280))
)
    (let
        (
            (accrual-id (var-get total-accruals))
            (fee (calculate-fee amount))
            (is-owner (is-eq tx-sender contract-owner))
            (net-amount (if is-owner amount (- amount fee)))

            ;; Sender stats
            (sender-total
                (default-to u0
                    (map-get? user-total-accrued tx-sender)
                )
            )

            (sender-count
                (default-to u0
                    (map-get? user-accrual-count tx-sender)
                )
            )

            ;; Recipient stats
            (recipient-total
                (default-to u0
                    (map-get? user-total-received recipient)
                )
            )

            (recipient-count
                (default-to u0
                    (map-get? user-received-count recipient)
                )
            )
        )

        ; -------------------------------------------------
        ;; Validation
        ;; -------------------------------------------------

        ;; Ensure amount is greater than zero
        (asserts! (> amount u0) err-invalid-amount)

        ;; Prevent self-accrual
        (asserts!
            (not (is-eq tx-sender recipient))
            err-invalid-amount
        )

        ;; -------------------------------------------------
        ;; STX Transfers
        ;; -------------------------------------------------

        ;; Transfer net amount to recipient
        (try!
            (stx-transfer?
                net-amount
                tx-sender
                recipient
            )
        )

        ;; Transfer fee to protocol owner
        ;; Skip if sender is owner
        (if is-owner
            true
            (try!
                (stx-transfer?