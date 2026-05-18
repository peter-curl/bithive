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