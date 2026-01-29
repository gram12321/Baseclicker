# Raw Resource Production System – Implementation Plan

## Purpose

Define a **coherent, scalable raw‑resource system** for an industrial simulation game that:

* Avoids recipe explosion
* Preserves realism where it adds gameplay value
* Creates long‑term strategic differentiation
* Keeps mining as *one chain among many*, not the dominant system

This document is intended for use by coding / design agents as a **source‑of‑truth plan**.

---

## High‑Level Design Goals

* **One mental model** across all raw resources
* **Hidden but learnable variability** (batch‑based, not per‑tick RNG)
* **One primary output per deposit**
* **Waste is pressure, not a tax**
* **Late‑game depth without early complexity**

---

## Core Abstractions

### 1. OreBatch (Central Concept)

Mining never outputs refined items. It outputs **OreBatch** objects.

An OreBatch:

* Is a single inventory item
* Has a **hidden composition** (data object)
* Composition is fixed for the batch lifetime
* Composition varies:

  * By deposit recipe
  * Slightly by batch (bounded randomness)

OreBatches are *revealed* only when processed.

---

### 2. Buildings (Minimal Set)

#### Mine

* Single building
* Multiple **deposit recipes**
* Outputs OreBatch

#### Smelter

* Generic metal smelter
* Input: OreBatch + fuel (coal) **or** electricity (where applicable)
* Output:

  * One **Primary Metal**
  * One **Waste Output** (slag / red mud)

#### Refinery (Generic, Justified)

* Used where real processes require an intermediate step
* Currently required only for Aluminum

#### Secondary Recovery Plant (Late Game)

* Optional
* Extracts trace materials from waste
* Always lossy

---

## Mining Deposits (Recipes)

Each recipe defines:

* Primary metal identity
* Expected composition ranges
* Waste characteristics

### Supported Deposits (Initial Scope)

* Iron Ore Deposit
* Copper‑rich Iron Deposit
* Copper Sulfide Ore
* Nickel Laterite
* Gold Sulfide Ore
* Bauxite Deposit
* Coal Seam

---

## Metal Chains

### Iron (Baseline Bulk Metal)

```
Mine (Iron Ore)
→ Smelter (Coal)
→ Iron + Slag
```

* High volume
* Moderate waste
* Slag reusable early

---

### Copper (Conductive Metal)

```
Mine (Copper Sulfide)
→ Smelter (Coal)
→ Copper + Slag
```

* Medium volume
* Slag may contain trace gold/silver (late game)

---

### Nickel (Alloy Metal)

```
Mine (Nickel Laterite)
→ Smelter (Coal)
→ Nickel + Slag
```

* Low yield
* High slag volume
* High value density

---

### Gold (Prestige Metal)

```
Mine (Gold Sulfide)
→ Smelter (Coal)
→ Gold + Slag
```

* Extremely low yield
* Massive waste
* Political / prestige hooks later

---

### Aluminum (Electricity‑Driven Chain)

**Only chain with a mandatory intermediate step.**

```
Mine (Bauxite)
→ Refinery (Coal)
→ Alumina + Red Mud
→ Smelter (Electricity + small Coal)
→ Aluminum
```

* Electricity‑dominant cost
* Red mud is toxic, bulky waste
* Aluminum identity is distinct by energy profile

---

### Coal (Energy Backbone)

```
Mine (Coal Seam)
→ Coal
```

Coal is used for:

* Smelting fuel
* Refining fuel
* Carbon inputs (aluminum anodes)
* Power generation

Coal never produces slag.

---

## Waste System (Unified Model)

### Waste Types

* **Slag** (iron, copper, nickel, gold chains)
* **Red Mud** (aluminum chain only)

Both are inventory items with hidden composition.

---

### Waste Properties

Each waste batch tracks:

* `volume`
* `toxicity`

Design rule:

> Technology may reduce **volume OR toxicity**, never both to zero.

---

## Waste Usage Tiers

### Tier 1 – Physical Waste (MVP)

* Requires storage
* Storage has upkeep
* Overflow causes penalties

### Tier 2 – Low‑Grade Reuse (Mid Game)

* Construction filler
* Road base
* Land reclamation
* Always inferior to primary materials

### Tier 3 – Secondary Recovery (Late Game)

* Trace metal extraction
* Very low yields
* High cost
* Never eliminates waste entirely

---

## Critical Design Constraints (Lock These In)

1. **One OreBatch → One Primary Metal**
2. **No surprise metals without recovery tech**
3. **Batch‑level randomness only**
4. **Waste must never be strictly profitable**
5. **Red mud is always worse than slag**
6. **Mining must not dominate the economy**

---

## Player Experience Goals

* Early: Mining is understandable and contained
* Mid: Deposit choice matters
* Late: Optimization, recovery, and regional specialization emerge

---

## Future‑Safe Hooks (Do Not Implement Yet)

* Geological surveys
* Environmental regulation
* Waste trading / export
* Electricity market coupling
* Political pressure from toxic waste

---

## Summary

This system provides:

* A single, consistent production model
* Distinct economic identities per metal
* Realistic constraints without simulation bloat
* Clear expansion paths without refactoring

**Status:** Approved for implementation
