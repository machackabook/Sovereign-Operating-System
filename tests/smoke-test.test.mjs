import assert from 'node:assert/strict';
import test from 'node:test';
import { mailService } from '../src/services/mailService.ts';
import { financeService, FINANCE_CATALOG } from '../src/services/financeService.ts';
import { cloudIdentityService } from '../src/services/cloudIdentityService.ts';
import { unmaskAnonymousIdentity } from '../src/services/firebase.ts';

test('Smoke Test 1: Mail & Gmail API Integration for machackabook@gmail.com', async () => {
  const status = await mailService.getStatus();
  assert.equal(status.email, 'machackabook@gmail.com');
  assert.ok(status.totalMessages >= 3, 'Must contain initialized messages');
  assert.equal(status.status, 'ONLINE');

  const messages = await mailService.fetchMessages();
  assert.ok(messages.length >= 3, 'Fetched inbox messages');

  const draft = {
    to: 'machackabook@gmail.com',
    subject: '[Smoke Test] Automated Pipeline Dispatch',
    body: 'Verifying Gmail API dispatch and envelope serialization.',
  };
  const sendRes = await mailService.sendEmail(draft);
  assert.ok(sendRes.success, 'Email dispatch must succeed');
  assert.match(sendRes.message, /machackabook@gmail.com/);
});

test('Smoke Test 2: Multi-Gateway Finance Integration (Google Pay, Stripe, Cash App)', async () => {
  const gpayConfig = financeService.getGooglePayConfig('29.00');
  assert.equal(gpayConfig.apiVersion, 2);
  assert.equal(gpayConfig.transactionInfo.totalPrice, '29.00');

  const plan = FINANCE_CATALOG[0];
  const gpayReceipt = await financeService.processGooglePayment(plan);
  assert.equal(gpayReceipt.paymentMethod, 'GOOGLE_PAY');
  assert.equal(gpayReceipt.recipient, 'machackabook@gmail.com');
  assert.equal(gpayReceipt.status, 'SETTLED');

  const stripeIntent = await financeService.createStripePaymentIntent(plan);
  assert.ok(stripeIntent.clientSecret.startsWith('pi_'), 'Valid Stripe client secret format');
  
  const stripeReceipt = await financeService.finalizeStripePayment(plan, stripeIntent.clientSecret);
  assert.equal(stripeReceipt.paymentMethod, 'STRIPE');
  assert.equal(stripeReceipt.recipient, 'machackabook@gmail.com');

  const cashAppDetails = financeService.getCashAppPaymentDetails(plan);
  assert.equal(cashAppDetails.cashtag, '$MachackaBook');
  assert.ok(cashAppDetails.webUrl.includes('cash.app/$MachackaBook'));

  const cashReceipt = await financeService.recordCashAppPayment(plan, 'Unit Smoke Test');
  assert.equal(cashReceipt.paymentMethod, 'CASH_APP');
  assert.equal(cashReceipt.status, 'VERIFIED');

  const ledger = financeService.getReceipts();
  assert.ok(ledger.length >= 3, 'Ledger recorded transactions');
});

test('Smoke Test 3: Cloud SSO Identity (AWS STS & Microsoft Entra ID)', async () => {
  const awsSession = await cloudIdentityService.getAwsCallerIdentity();
  assert.equal(awsSession.provider, 'AWS_IAM_STS');
  assert.ok(awsSession.arn.includes('machackabook'));
  assert.equal(awsSession.authenticated, true);

  const msProfile = await cloudIdentityService.getMicrosoftProfile();
  assert.equal(msProfile.provider, 'MICROSOFT_ENTRA_ID');
  assert.equal(msProfile.mail, 'machackabook@gmail.com');
  assert.equal(msProfile.authenticated, true);

  const fedReport = await cloudIdentityService.getFederatedReport();
  assert.equal(fedReport.overallStatus, 'FEDERATED_ACTIVE');
  assert.ok(fedReport.firebaseAuth.uid, 'Firebase session UID present');
});

test('Smoke Test 4: Anonymous Identity Unmasking', async () => {
  const unmasked = await unmaskAnonymousIdentity();
  assert.ok(unmasked.uid, 'Unmasked UID must exist');
  assert.ok(unmasked.displayName, 'Unmasked display name must exist');
  assert.ok(typeof unmasked.elevationAvailable === 'boolean');
});
