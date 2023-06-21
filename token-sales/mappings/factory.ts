import { BigInt, log } from "@graphprotocol/graph-ts";
import { PresaleCreated as PresaleCreatedEvent } from "../generated/PresaleFactory/PresaleFactory";
import { TokenSale, Token, PresaleFactory } from "../generated/schema";
import { Presale as TokenSaleTemplate } from "../generated/templates";
import { fetchTokenName, fetchTokenSymbol, fetchTokenDecimals, fetchTokenTotalSupply } from "./utils/erc20";
import { FACTORY_ADDRESS, ZERO_BI } from "./constants";

export function handlePresaleCreated(event: PresaleCreatedEvent): void {
  let factory = PresaleFactory.load(FACTORY_ADDRESS);

  if (factory === null) {
    factory = new PresaleFactory(FACTORY_ADDRESS);
    factory.salesCount = 0;
  }

  factory.salesCount += 1;
  factory.save();

  let paymentToken = Token.load(event.params.paymentToken.toHex());
  let saleToken = Token.load(event.params.saleToken.toHex());

  if (paymentToken === null) {
    paymentToken = new Token(event.params.paymentToken.toHex());
    paymentToken.name = fetchTokenName(event.params.paymentToken);
    paymentToken.symbol = fetchTokenSymbol(event.params.paymentToken);
    let decimals = fetchTokenDecimals(event.params.paymentToken);

    if (decimals === null) {
      log.debug("could not fetch token decimals", []);
      return;
    }

    paymentToken.decimals = decimals;

    let totalSupply = fetchTokenTotalSupply(event.params.paymentToken);

    if (totalSupply === null) {
      log.debug("could not fetch token total supply", []);
      return;
    }

    paymentToken.totalSupply = totalSupply.div(BigInt.fromI32(10).pow(paymentToken.decimals.toI32() as u8));

    paymentToken.save();
  }

  if (saleToken === null) {
    saleToken = new Token(event.params.saleToken.toHex());
    saleToken.name = fetchTokenName(event.params.saleToken);
    saleToken.symbol = fetchTokenSymbol(event.params.saleToken);
    let decimals = fetchTokenDecimals(event.params.saleToken);

    if (decimals === null) {
      log.debug("could not fetch token decimals", []);
      return;
    }

    saleToken.decimals = decimals;

    let totalSupply = fetchTokenTotalSupply(event.params.saleToken);

    if (totalSupply === null) {
      log.debug("could not fetch token total supply", []);
      return;
    }

    saleToken.totalSupply = totalSupply.div(BigInt.fromI32(10).pow(saleToken.decimals.toI32() as u8));

    saleToken.save();
  }

  const entity = new TokenSale(event.params.presaleId.toHex());
  entity.presaleId = event.params.presaleId;
  entity.metadataURI = event.params.metadataURI;
  entity.funder = event.params.funder;
  entity.salePrice = event.params.salePrice.div(BigInt.fromI32(10).pow(paymentToken.decimals.toI32() as u8));
  entity.paymentToken = event.params.paymentToken.toHex();
  entity.saleToken = event.params.saleToken.toHex();
  entity.startTime = event.params.startTime;
  entity.endTime = event.params.endTime;
  entity.minTotalPayment = event.params.minTotalPayment.div(BigInt.fromI32(10).pow(paymentToken.decimals.toI32() as u8));
  entity.maxTotalPayment = event.params.maxTotalPayment.div(BigInt.fromI32(10).pow(paymentToken.decimals.toI32() as u8));
  entity.withdrawDelay = event.params.withdrawDelay;

  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.vestingType = null;
  entity.cliffPeriod = [];
  entity.linearVesting = null;
  entity.totalPaymentMade = ZERO_BI;

  entity.save();

  TokenSaleTemplate.create(event.params.presaleId);
}