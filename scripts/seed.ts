/**
 * GolfGive Demo Data Seed Script
 *
 * Creates realistic demo accounts + populated database for internship submission.
 *
 * Demo Accounts:
 *   Admin:  admin@golfgive.demo  / Admin123!
 *   User 1: user1@golfgive.demo  / User123!
 *   User 2: user2@golfgive.demo  / User123!
 *
 * Run with:
 *   npx ts-node --project tsconfig.json scripts/seed.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY env variable set in .env.local
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Demo Account Definitions ────────────────────────────────────────────────

const DEMO_ACCOUNTS = [
  {
    email: 'admin@golfgive.demo',
    password: 'Admin123!',
    full_name: 'Alex Admin',
    role: 'admin',
  },
  {
    email: 'user1@golfgive.demo',
    password: 'User123!',
    full_name: 'Jamie Golfer',
    role: 'user',
  },
  {
    email: 'user2@golfgive.demo',
    password: 'User123!',
    full_name: 'Morgan Player',
    role: 'user',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function dateString(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toISOString().split('T')[0];
}

function monthsAgo(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

// ─── Seed Functions ───────────────────────────────────────────────────────────

async function createUsers(): Promise<Record<string, string>> {
  console.log('\n📦 Creating demo user accounts...');
  const ids: Record<string, string> = {};

  for (const account of DEMO_ACCOUNTS) {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users.find((u) => u.email === account.email);

    let userId: string;

    if (existing) {
      console.log(`  ℹ️  User already exists: ${account.email}`);
      userId = existing.id;
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          full_name: account.full_name,
          role: account.role,
        },
      });

      if (error) {
        console.error(`  ❌ Failed to create ${account.email}:`, error.message);
        continue;
      }

      userId = data.user.id;
      console.log(`  ✅ Created: ${account.email} (${account.role})`);
    }

    // Upsert profile to ensure role is set correctly
    await supabase.from('profiles').upsert({
      id: userId,
      email: account.email,
      full_name: account.full_name,
      role: account.role,
    });

    ids[account.email] = userId;
  }

  return ids;
}

async function seedCharities(adminId: string) {
  console.log('\n🏌️  Seeding charities...');

  const charities = [
    {
      name: 'Golf For Good Foundation',
      description: 'Supporting underprivileged youth access to golf programs and equipment across the UK.',
      logo_url: 'https://placehold.co/100x100/10b981/white?text=GFG',
      website: 'https://golfforgood.example.com',
      is_active: true,
      total_raised: 12500.00,
      created_by: adminId,
    },
    {
      name: 'Links to Recovery',
      description: 'Using golf as therapy for veterans and individuals recovering from addiction.',
      logo_url: 'https://placehold.co/100x100/3b82f6/white?text=L2R',
      website: 'https://linkstorecovery.example.com',
      is_active: true,
      total_raised: 8750.00,
      created_by: adminId,
    },
    {
      name: 'Green Heart Initiative',
      description: 'Environmental conservation through golf course sustainability partnerships.',
      logo_url: 'https://placehold.co/100x100/22c55e/white?text=GHI',
      website: 'https://greenheartinitiative.example.com',
      is_active: true,
      total_raised: 5200.00,
      created_by: adminId,
    },
  ];

  const { data, error } = await supabase.from('charities').upsert(charities, { onConflict: 'name' }).select();
  if (error) console.error('  ❌ Charities error:', error.message);
  else console.log(`  ✅ ${data?.length || 0} charities seeded`);

  return data || [];
}

async function seedSubscriptions(user1Id: string, user2Id: string) {
  console.log('\n💳 Seeding subscriptions...');


  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  const subscriptions = [
    {
      user_id: user1Id,
      plan: 'monthly',
      status: 'active',
      amount: 9.99,
      start_date: daysAgo(15),
      end_date: nextMonth.toISOString(),
      stripe_subscription_id: 'sub_demo_user1_monthly',
      created_at: daysAgo(15),
    },
    {
      user_id: user2Id,
      plan: 'yearly',
      status: 'active',
      amount: 89.99,
      start_date: daysAgo(45),
      end_date: nextYear.toISOString(),
      stripe_subscription_id: 'sub_demo_user2_yearly',
      created_at: daysAgo(45),
    },
  ];

  const { data, error } = await supabase.from('subscriptions').upsert(subscriptions, { onConflict: 'user_id' }).select();
  if (error) console.error('  ❌ Subscriptions error:', error.message);
  else console.log(`  ✅ ${data?.length || 0} subscriptions seeded`);
}

async function seedGolfScores(user1Id: string, user2Id: string) {
  console.log('\n⛳ Seeding golf scores...');

  const scores: object[] = [];

  // User 1: 20 scores over the past 30 days
  for (let i = 0; i < 20; i++) {
    scores.push({
      user_id: user1Id,
      score: randomBetween(18, 42),
      score_date: dateString(i + 1),
    });
  }

  // User 2: 15 scores over the past 25 days
  for (let i = 0; i < 15; i++) {
    scores.push({
      user_id: user2Id,
      score: randomBetween(20, 45),
      score_date: dateString(i + 1),
    });
  }

  // Insert in batches to avoid conflicts
  let inserted = 0;
  for (const score of scores) {
    const { error } = await supabase.from('golf_scores').upsert(score, { onConflict: 'user_id,score_date' });
    if (!error) inserted++;
  }

  console.log(`  ✅ ${inserted} golf scores seeded`);
}

async function seedDraws(): Promise<string[]> {
  console.log('\n🎰 Seeding draws...');

  const draws = [];
  const drawIds: string[] = [];

  // 3 months of draws
  for (let i = 3; i >= 0; i--) {
    const { month, year } = monthsAgo(i);
    const isPast = i > 0;

    draws.push({
      draw_month: month,
      draw_year: year,
      draw_type: 'monthly',
      status: isPast ? 'published' : 'pending',
      winning_numbers: isPast ? [randomBetween(1, 45), randomBetween(1, 45), randomBetween(1, 45), randomBetween(1, 45), randomBetween(1, 45)] : null,
      jackpot_amount: isPast ? 500.00 : 750.00,
      created_at: daysAgo(i * 30 + 5),
    });
  }

  const { data, error } = await supabase.from('draws').upsert(draws, { onConflict: 'draw_month,draw_year,draw_type' }).select();
  if (error) console.error('  ❌ Draws error:', error.message);
  else {
    console.log(`  ✅ ${data?.length || 0} draws seeded`);
    data?.forEach((d) => drawIds.push(d.id));
  }

  return drawIds;
}

async function seedDrawEntries(drawIds: string[], user1Id: string, user2Id: string) {
  console.log('\n🎟️  Seeding draw entries...');

  if (!drawIds.length) return;

  const entries: object[] = [];

  for (const drawId of drawIds) {
    // User 1 entry
    entries.push({
      draw_id: drawId,
      user_id: user1Id,
      entry_numbers: [randomBetween(1, 45), randomBetween(1, 45), randomBetween(1, 45), randomBetween(1, 45), randomBetween(1, 45)],
    });

    // User 2 entry
    entries.push({
      draw_id: drawId,
      user_id: user2Id,
      entry_numbers: [randomBetween(1, 45), randomBetween(1, 45), randomBetween(1, 45), randomBetween(1, 45), randomBetween(1, 45)],
    });
  }

  const { data, error } = await supabase.from('draw_entries').upsert(entries, { onConflict: 'draw_id,user_id' }).select();
  if (error) console.error('  ❌ Draw entries error:', error.message);
  else console.log(`  ✅ ${data?.length || 0} draw entries seeded`);
}

async function seedWinners(drawIds: string[], user1Id: string) {
  console.log('\n🏆 Seeding winners...');

  if (!drawIds.length) return;

  // User 1 wins the first published draw
  const firstDrawId = drawIds[0];

  const { data, error } = await supabase.from('winners').upsert([
    {
      user_id: user1Id,
      draw_id: firstDrawId,
      match_type: '3_match',
      prize_amount: 250.00,
      proof_url: 'https://example.com/proof/demo-proof-1.pdf',
      verification_status: 'approved',
      payment_status: 'paid',
      review_notes: 'Demo winner - verified for submission showcase.',
      verified_at: daysAgo(45),
      paid_at: daysAgo(40),
    },
  ], { onConflict: 'user_id,draw_id' }).select();

  if (error) console.error('  ❌ Winners error:', error.message);
  else console.log(`  ✅ ${data?.length || 0} winners seeded`);
}

async function seedDonations(charities: { id: string }[], user1Id: string, user2Id: string) {
  console.log('\n❤️  Seeding donations...');

  if (!charities.length) return;

  const donations: object[] = [];

  for (let i = 0; i < 8; i++) {
    donations.push({
      user_id: i % 2 === 0 ? user1Id : user2Id,
      charity_id: charities[i % charities.length].id,
      amount: [5, 10, 15, 25, 50][randomBetween(0, 4)],
      created_at: daysAgo(randomBetween(1, 90)),
    });
  }

  const { data, error } = await supabase.from('user_charities').insert(donations).select();
  if (error) console.error('  ❌ Donations error:', error.message);
  else console.log(`  ✅ ${data?.length || 0} donations seeded`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 GolfGive Demo Seed Script');
  console.log('================================');

  const userIds = await createUsers();

  const adminId = userIds['admin@golfgive.demo'];
  const user1Id = userIds['user1@golfgive.demo'];
  const user2Id = userIds['user2@golfgive.demo'];

  if (!adminId || !user1Id || !user2Id) {
    console.error('\n❌ Could not retrieve all user IDs. Aborting.');
    process.exit(1);
  }

  const charities = await seedCharities(adminId);
  await seedSubscriptions(user1Id, user2Id);
  await seedGolfScores(user1Id, user2Id);

  const drawIds = await seedDraws();
  await seedDrawEntries(drawIds, user1Id, user2Id);
  await seedWinners(drawIds, user1Id);
  await seedDonations(charities as { id: string }[], user1Id, user2Id);

  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Demo Credentials:');
  console.log('   Admin:  admin@golfgive.demo / Admin123!');
  console.log('   User 1: user1@golfgive.demo / User123!');
  console.log('   User 2: user2@golfgive.demo / User123!');
  console.log('\n🚀 Run `npm run dev` to start the application.');
}

main().catch((err) => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
