;; BitHive - sBTC/STX Crowdfunding Platform
;; Decentralized crowdfunding for builders to raise BTC-backed or STX capital
;; 
;; Features:
;; - Create campaigns with sBTC or STX funding goals
;; - Contribute sBTC OR STX to back projects you believe in
;; - Automatic refunds if campaign goal not reached
;; - Milestone-based fund release
;; - Creator and backer reputation tracking
;; - 2% platform fee on successful campaigns

;; Use the official SIP-010 trait (mainnet address - Clarinet remaps for simnet/devnet)
(use-trait sip-010-trait 'ST1NXBK3K5YYMD6FD41MVNP3JS1GABZ8TRVX023PT.sip-010-trait-ft-standard.sip-010-trait)

;; ========================================
;; Constants
;; ========================================

(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-campaign-owner (err u101))
(define-constant err-campaign-not-found (err u102))
(define-constant err-campaign-ended (err u103))
(define-constant err-campaign-active (err u104))
(define-constant err-goal-not-reached (err u105))
(define-constant err-already-claimed (err u106))
(define-constant err-no-contribution (err u107))
(define-constant err-invalid-amount (err u108))
(define-constant err-campaign-failed (err u109))
(define-constant err-transfer-failed (err u110))
(define-constant err-milestone-not-found (err u111))
(define-constant err-milestone-not-ready (err u112))
(define-constant err-milestone-already-completed (err u113))
(define-constant err-invalid-milestone-amount (err u114))
(define-constant err-refunds-not-enabled (err u115))
(define-constant err-not-initialized (err u116))
(define-constant err-already-initialized (err u117))

;; Platform fee: 2% (200 basis points)
(define-constant platform-fee-bps u200)
(define-constant bps-denominator u10000)

;; ========================================
;; Data Variables
;; ========================================

(define-data-var campaign-nonce uint u0)
(define-data-var total-raised uint u0)
(define-data-var total-campaigns uint u0)
(define-data-var successful-campaigns uint u0)
(define-data-var treasury principal contract-owner)
(define-data-var contract-address (optional principal) none)
(define-data-var is-initialized bool false)

;; ========================================
;; Data Maps
;; ========================================

;; Campaign storage
(define-map campaigns uint
  {
    owner: principal,
    title: (string-utf8 128),
    description: (string-utf8 1024),
    goal: uint,
    raised: uint,                  ;; sBTC raised
    stx-raised: uint,              ;; STX raised
    contributors-count: uint,
    start-block: uint,
    end-block: uint,
    claimed: bool,
    stx-claimed: bool,             ;; Track STX claims separately
    refunds-enabled: bool,
    milestones-count: uint,
    milestones-completed: uint
  }
)