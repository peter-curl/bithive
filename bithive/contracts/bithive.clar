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

;; Contributions per campaign per user (sBTC)
(define-map contributions 
  { campaign-id: uint, contributor: principal } 
  uint
)

;; STX contributions per campaign per user
(define-map stx-contributions
  { campaign-id: uint, contributor: principal }
  uint
)

;; Campaign milestones
(define-map milestones 
  { campaign-id: uint, milestone-id: uint }
  {
    title: (string-utf8 128),
    description: (string-utf8 512),
    amount: uint,
    completed: bool,
    claimed: bool
  }
)

;; Creator stats for reputation
(define-map creator-stats principal
  {
    campaigns-created: uint,
    campaigns-successful: uint,
    total-raised: uint
  }
)

;; Backer stats for reputation
(define-map backer-stats principal
  {
    campaigns-backed: uint,
    total-contributed: uint,
    refunds-received: uint
  }
)

;; ========================================
;; Private Helper Functions
;; ========================================

;; Get the stored contract address (must be initialized first)
(define-private (get-escrow-address)
  (unwrap-panic (var-get contract-address))
)

;; Transfer sBTC from sender to recipient
(define-private (transfer-sbtc 
    (token-contract <sip-010-trait>)
    (amount uint)
    (sender principal)
    (recipient principal))
  (contract-call? token-contract transfer amount sender recipient none)
)

;; ========================================
;; Initialization
;; ========================================

;; Initialize the contract - must be called once after deployment
;; This stores the contract's principal for escrow operations
(define-public (initialize)
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (asserts! (not (var-get is-initialized)) err-already-initialized)
    (var-set contract-address (some current-contract))
    (var-set is-initialized true)
    (ok true)
  )
)

;; ========================================
;; Read-Only Functions
;; ========================================

(define-read-only (get-campaign (campaign-id uint))
  (map-get? campaigns campaign-id)
)

(define-read-only (get-contribution (campaign-id uint) (contributor principal))
  (default-to u0 
    (map-get? contributions { campaign-id: campaign-id, contributor: contributor })
  )
)

(define-read-only (get-stx-contribution (campaign-id uint) (contributor principal))
  (default-to u0
    (map-get? stx-contributions { campaign-id: campaign-id, contributor: contributor })
  )
)

(define-read-only (get-milestone (campaign-id uint) (milestone-id uint))
  (map-get? milestones { campaign-id: campaign-id, milestone-id: milestone-id })
)

(define-read-only (get-creator-stats (creator principal))
  (default-to 
    { campaigns-created: u0, campaigns-successful: u0, total-raised: u0 }
    (map-get? creator-stats creator)
  )
)

(define-read-only (get-backer-stats (backer principal))
  (default-to 
    { campaigns-backed: u0, total-contributed: u0, refunds-received: u0 }
    (map-get? backer-stats backer)
  )
)

(define-read-only (get-platform-stats)
  {
    total-campaigns: (var-get total-campaigns),
    successful-campaigns: (var-get successful-campaigns),
    total-raised: (var-get total-raised)
  }
)

(define-read-only (is-campaign-active (campaign-id uint))
  (match (map-get? campaigns campaign-id)
    campaign 
    (and 
      (<= stacks-block-height (get end-block campaign)) 
      (not (get claimed campaign))
      (not (get refunds-enabled campaign))
    )
    false
  )
)

(define-read-only (is-campaign-successful (campaign-id uint))
  (match (map-get? campaigns campaign-id)
    campaign (>= (get raised campaign) (get goal campaign))
    false
  )
)

(define-read-only (calculate-fee (amount uint))
  (/ (* amount platform-fee-bps) bps-denominator)
)

(define-read-only (get-progress-percentage (campaign-id uint))
  (match (map-get? campaigns campaign-id)
    campaign 
    (if (> (get goal campaign) u0)
      (/ (* (get raised campaign) u100) (get goal campaign))
      u0
    )
    u0
  )
)

(define-read-only (get-time-remaining (campaign-id uint))
  (match (map-get? campaigns campaign-id)
    campaign 
    (if (> (get end-block campaign) stacks-block-height)
      (- (get end-block campaign) stacks-block-height)
      u0
    )
    u0
  )
)

(define-read-only (get-treasury)
  (var-get treasury)
)

(define-read-only (get-campaign-nonce)
  (var-get campaign-nonce)
)

;; ========================================
;; Public Functions - Campaign Management
;; ========================================

;; Create a new crowdfunding campaign
(define-public (create-campaign 
    (title (string-utf8 128)) 
    (description (string-utf8 1024)) 
    (goal uint) 
    (duration uint))
  (let
    (
      (campaign-id (var-get campaign-nonce))
    )
    (asserts! (> goal u0) err-invalid-amount)
    (asserts! (> duration u0) err-invalid-amount)
    
    ;; Create campaign
    (map-set campaigns campaign-id {
      owner: tx-sender,
      title: title,
      description: description,
      goal: goal,
      raised: u0,
      stx-raised: u0,
      contributors-count: u0,
      start-block: stacks-block-height,
      end-block: (+ stacks-block-height duration),
      claimed: false,
      stx-claimed: false,
      refunds-enabled: false,
      milestones-count: u0,
      milestones-completed: u0
    })
    
    ;; Update global stats
    (var-set campaign-nonce (+ campaign-id u1))
    (var-set total-campaigns (+ (var-get total-campaigns) u1))
    
    ;; Update creator stats
    (let ((stats (get-creator-stats tx-sender)))
      (map-set creator-stats tx-sender 
        (merge stats { campaigns-created: (+ (get campaigns-created stats) u1) })
      )
    )
    
    (print { 
      event: "campaign-created", 
      campaign-id: campaign-id, 
      owner: tx-sender,
      goal: goal,
      end-block: (+ stacks-block-height duration)
    })
    
    (ok { campaign-id: campaign-id, end-block: (+ stacks-block-height duration) })
  )
)