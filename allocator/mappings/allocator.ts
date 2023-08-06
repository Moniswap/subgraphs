import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Stake as StakeEvent, TierAdded as TierAddedEvent, Unstake as UnstakeEvent } from "../generated/Allocator/Allocator";
import { Account, Allocator, Tier } from "../generated/schema";
import { ALLOCATOR_ADDRESS } from "./constants";

export function handleStake(event: StakeEvent): void {
  let allocator = Allocator.load(ALLOCATOR_ADDRESS);

  if (allocator == null) {
    allocator = new Allocator(ALLOCATOR_ADDRESS);
    allocator.totalTokensStaked = BigDecimal.zero();
  }

  const accountId = event.params.account.toHex();
  let account = Account.load(accountId);

  if (account == null) {
    account = new Account(accountId);
    account.firstStakeLockPeriod = event.params.lockDuration;
    account.firstStakeTimestamp = event.params.timestamp;
    account.amountStaked = BigDecimal.zero();
  }

  const amount = event.params.amount.toBigDecimal().div(BigInt.fromU64(1e18 as u64).toBigDecimal());
  account.amountStaked = account.amountStaked.plus(amount);
  account.save();

  allocator.totalTokensStaked = allocator.totalTokensStaked.plus(amount);
  allocator.save();
}

export function handleTierAdded(event: TierAddedEvent): void {
  let allocator = Allocator.load(ALLOCATOR_ADDRESS);

  if (allocator == null) {
    allocator = new Allocator(ALLOCATOR_ADDRESS);
    allocator.totalTokensStaked = BigDecimal.zero();
  }

  const tier = new Tier(event.address.toHex() + ":" + event.params.name);
  tier.name = event.params.name;
  tier.num = event.params.num.div(BigInt.fromU64(1e18 as u64));
  tier.save();

  allocator.save();
}

export function handleUnstake(event: UnstakeEvent): void {
  const allocator = Allocator.load(ALLOCATOR_ADDRESS) as Allocator;
  const accountId = event.params.account.toHex();
  const account = Account.load(accountId) as Account;

  const amount = event.params.amount.toBigDecimal().div(BigInt.fromU64(1e18 as u64).toBigDecimal());
  account.amountStaked = account.amountStaked.minus(amount);
  account.save();

  allocator.totalTokensStaked = allocator.totalTokensStaked.minus(amount);
  allocator.save();
}