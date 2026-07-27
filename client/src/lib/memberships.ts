import { profiles } from '../utils/mockData'
import { scheduleCloudSave } from './cloudSync'

export type MembershipPlan = { username: string; price: number; createdAt: number }
export type MembershipPurchase = { username: string; price: number; startedAt: number; renewsAt: number }

const plansKey = 'socialstart-membership-plans'
const purchasesKey = 'socialstart-membership-purchases'

const read = <T,>(key: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(key) || '') as T } catch { return fallback }
}

export const membershipPlanFor = (username: string): MembershipPlan | null => {
  const saved = read<Record<string, MembershipPlan>>(plansKey, {})[username]
  if (saved) return saved
  const example = profiles.find(profile => profile.username === username) as { membershipPrice?: number } | undefined
  return example?.membershipPrice ? { username, price: example.membershipPrice, createdAt: Date.now() } : null
}

export const saveMembershipPlan = (plan: MembershipPlan) => {
  const plans = read<Record<string, MembershipPlan>>(plansKey, {})
  localStorage.setItem(plansKey, JSON.stringify({ ...plans, [plan.username]: plan }))
  scheduleCloudSave()
}

export const endMembershipPlan = (username: string) => {
  const plans = read<Record<string, MembershipPlan>>(plansKey, {})
  delete plans[username]
  localStorage.setItem(plansKey, JSON.stringify(plans))
  scheduleCloudSave()
}

export const activeMembershipFor = (username: string) => {
  const purchase = read<Record<string, MembershipPurchase>>(purchasesKey, {})[username]
  return purchase && purchase.renewsAt > Date.now() ? purchase : null
}

export const purchaseMembership = (username: string, price: number) => {
  const purchases = read<Record<string, MembershipPurchase>>(purchasesKey, {})
  const startedAt = Date.now()
  const renewsAt = new Date(startedAt)
  renewsAt.setMonth(renewsAt.getMonth() + 1)
  localStorage.setItem(purchasesKey, JSON.stringify({
    ...purchases,
    [username]: { username, price, startedAt, renewsAt: renewsAt.getTime() },
  }))
  scheduleCloudSave()
}
