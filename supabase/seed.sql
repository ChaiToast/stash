-- STASH demo seed (local / staging only)
-- Runs automatically on: npm run db:reset
--
-- Demo login:
--   Email:    demo@stash.app
--   Password: stashdemo123
--
-- Requires NEXT_PUBLIC_DEMO_MODE=true on the web app to show the demo sign-in button.

create extension if not exists pgcrypto;

do $$
declare
  demo_user_id uuid := '11111111-1111-1111-1111-111111111111';
begin
  if exists (select 1 from auth.users where id = demo_user_id) then
    raise notice 'Demo user already exists, skipping auth seed.';
  else
    insert into auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) values (
      demo_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'demo@stash.app',
      crypt('stashdemo123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"STASH Demo"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      demo_user_id,
      demo_user_id,
      demo_user_id::text,
      jsonb_build_object('sub', demo_user_id::text, 'email', 'demo@stash.app'),
      'email',
      now(),
      now(),
      now()
    );
  end if;
end $$;

-- Profile tweaks (trigger creates the row on auth.users insert)
update public.users
set
  username = 'demo',
  plan = 'lifetime_solo',
  streak_days = 4,
  last_active = now(),
  posts_synced = 0
where id = '11111111-1111-1111-1111-111111111111';

insert into public.posts (
  user_id,
  ig_url,
  caption,
  image_alt,
  category,
  confidence,
  title,
  structured_data,
  is_done,
  tags,
  notes,
  thumbnail_url,
  source_account,
  ig_saved_at
) values
  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-gnocchi/', '15-min crispy gnocchi with brown butter sage', 'Bowl of gnocchi with sage leaves', 'RECIPE', 0.94, 'Crispy Brown Butter Gnocchi', '{"ingredients":["gnocchi","butter","sage","parmesan","black pepper"],"steps":["Pan-fry gnocchi until crisp","Brown butter with sage","Toss and finish with parmesan"],"cook_time":"15 min","cuisine":"Italian"}', true, '{weeknight,italian}', 'Make this on busy Tuesdays.', 'https://picsum.photos/seed/stash-gnocchi/600/600', 'foodbylena', now() - interval '12 days'),
  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-overnight-oats/', 'Protein overnight oats for meal prep', 'Jar of overnight oats with berries', 'RECIPE', 0.91, 'Protein Overnight Oats', '{"ingredients":["oats","greek yogurt","chia seeds","berries","honey"],"steps":["Mix base","Refrigerate overnight","Top with fruit"],"cook_time":"5 min prep","cuisine":"Breakfast"}', false, '{meal-prep,breakfast}', null, 'https://picsum.photos/seed/stash-oats/600/600', 'fitfuel', now() - interval '10 days'),
  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-miso-salmon/', 'Miso glazed salmon sheet pan dinner', 'Salmon fillet with miso glaze', 'RECIPE', 0.93, 'Miso Glazed Salmon', '{"ingredients":["salmon","miso paste","soy sauce","ginger","broccoli"],"steps":["Whisk glaze","Roast salmon and veg","Broil to finish"],"cook_time":"25 min","cuisine":"Japanese"}', false, '{dinner,sheet-pan}', null, 'https://picsum.photos/seed/stash-salmon/600/600', 'weeknighteats', now() - interval '8 days'),
  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-shakshuka/', 'One pan shakshuka for brunch', 'Shakshuka in cast iron skillet', 'RECIPE', 0.88, 'One Pan Shakshuka', '{"ingredients":["eggs","tomatoes","peppers","onion","cumin"],"steps":["Simmer sauce","Poach eggs","Serve with bread"],"cook_time":"30 min","cuisine":"Middle Eastern"}', true, '{brunch}', null, 'https://picsum.photos/seed/stash-shakshuka/600/600', 'brunchclub', now() - interval '6 days'),
  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-pasta-aglio/', 'Aglio e olio when pantry is empty', 'Spaghetti aglio e olio', 'RECIPE', 0.90, 'Emergency Aglio e Olio', '{"ingredients":["spaghetti","garlic","olive oil","parsley","chili flakes"],"steps":["Boil pasta","Infuse oil with garlic","Toss and serve"],"cook_time":"20 min","cuisine":"Italian"}', false, '{pantry,pasta}', null, 'https://picsum.photos/seed/stash-aglio/600/600', 'pastagram', now() - interval '4 days'),

  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-push-day/', 'Push day dumbbell only', 'Person doing dumbbell bench press', 'WORKOUT', 0.92, 'Dumbbell Push Day', '{"exercises":["DB bench press","Incline press","Lateral raises","Tricep extensions"],"muscle_group":"Chest and shoulders","duration":"45 min"}', true, '{strength,home}', null, 'https://picsum.photos/seed/stash-push/600/600', 'homegymhero', now() - interval '11 days'),
  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-20min-hiit/', 'No equipment 20 min HIIT', 'HIIT workout graphic', 'WORKOUT', 0.89, '20-Minute HIIT Burn', '{"exercises":["Jump squats","Mountain climbers","Burpees","High knees"],"muscle_group":"Full body","duration":"20 min"}', false, '{hiit,cardio}', null, 'https://picsum.photos/seed/stash-hiit/600/600', 'sweatdaily', now() - interval '7 days'),
  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-mobility/', '10 min morning mobility flow', 'Mobility stretch routine', 'WORKOUT', 0.86, 'Morning Mobility Flow', '{"exercises":["Cat cow","World greatest stretch","Hip flexor stretch","Thoracic rotations"],"muscle_group":"Mobility","duration":"10 min"}', false, '{recovery,morning}', null, 'https://picsum.photos/seed/stash-mobility/600/600', 'movewell', now() - interval '3 days'),

  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-atomic-habits/', 'Book rec: systems over goals', 'Atomic Habits book cover style photo', 'BOOK', 0.95, 'Atomic Habits', '{"author":"James Clear","genre":"Self-improvement"}', true, '{productivity}', 'Re-read chapter 1.', 'https://picsum.photos/seed/stash-atomic/600/600', 'readwithme', now() - interval '20 days'),
  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-project-hail/', 'Sci-fi rec for rainy weekends', 'Project Hail Mary aesthetic', 'BOOK', 0.93, 'Project Hail Mary', '{"author":"Andy Weir","genre":"Science fiction"}', false, '{fiction}', null, 'https://picsum.photos/seed/stash-hailmary/600/600', 'scifishelf', now() - interval '15 days'),
  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-deep-work/', 'Focus in a distracted world', 'Deep Work book aesthetic', 'BOOK', 0.90, 'Deep Work', '{"author":"Cal Newport","genre":"Productivity"}', false, '{focus}', null, 'https://picsum.photos/seed/stash-deepwork/600/600', 'focuslab', now() - interval '9 days'),

  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-dune-movie/', 'Rewatch before part three', 'Dune movie poster aesthetic', 'MOVIE', 0.92, 'Dune: Part Two', '{"platform":"Max","year":"2024"}', true, '{rewatch}', null, 'https://picsum.photos/seed/stash-dune/600/600', 'filmpicks', now() - interval '14 days'),
  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-past-lives/', 'Quiet heartbreak masterpiece', 'Past Lives film still mood', 'MOVIE', 0.91, 'Past Lives', '{"platform":"Paramount+","year":"2023"}', false, '{indie}', null, 'https://picsum.photos/seed/stash-pastlives/600/600', 'indiecinema', now() - interval '5 days'),

  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-bear/', 'Season 3 comfort chaos', 'The Bear kitchen scene aesthetic', 'SHOW', 0.90, 'The Bear', '{"platform":"Hulu","genre":"Drama"}', false, '{comfort-watch}', null, 'https://picsum.photos/seed/stash-bear/600/600', 'tvqueue', now() - interval '13 days'),
  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-slow-horses/', 'Underrated spy series', 'Slow Horses title mood board', 'SHOW', 0.88, 'Slow Horses', '{"platform":"Apple TV+","genre":"Thriller"}', true, '{series}', null, 'https://picsum.photos/seed/stash-slowhorses/600/600', 'bingeplan', now() - interval '2 days'),

  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-boundaries/', 'Protect your energy quote carousel', 'Minimal quote about boundaries', 'LIFE_ADVICE', 0.87, 'Protect Your Energy', '{"theme":"Boundaries","takeaway":"Say no without over-explaining."}', false, '{mindset}', null, 'https://picsum.photos/seed/stash-boundaries/600/600', 'mindfuldaily', now() - interval '16 days'),
  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-financial-peace/', 'Pay yourself first reminder', 'Finance advice carousel', 'LIFE_ADVICE', 0.85, 'Pay Yourself First', '{"theme":"Money habits","takeaway":"Automate savings before spending."}', false, '{finance}', null, 'https://picsum.photos/seed/stash-finance/600/600', 'moneyclarity', now() - interval '1 day'),

  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-standing-desk/', 'Desk setup upgrade', 'Minimal standing desk setup', 'PRODUCT', 0.89, 'Standing Desk Setup', '{"brand":"FlexiSpot","product_type":"Desk","use_case":"Home office ergonomics"}', false, '{workspace}', null, 'https://picsum.photos/seed/stash-desk/600/600', 'desksetup', now() - interval '18 days'),
  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-water-bottle/', 'Water bottle that actually stays cold', 'Insulated water bottle product shot', 'PRODUCT', 0.86, 'Insulated Water Bottle', '{"brand":"Hydro Flask","product_type":"Drinkware","use_case":"Daily hydration"}', true, '{gear}', null, 'https://picsum.photos/seed/stash-bottle/600/600', 'gearfinds', now() - interval '4 days'),

  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-lisbon/', '3 days in Lisbon itinerary', 'Lisbon tram and tiles', 'TRAVEL', 0.94, 'Lisbon Long Weekend', '{"location":"Lisbon, Portugal","highlights":["Alfama walk","Time Out Market","Sintra day trip"]}', false, '{europe,spring}', 'Book flights in September.', 'https://picsum.photos/seed/stash-lisbon/600/600', 'travelnotes', now() - interval '22 days'),
  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-tokyo/', 'First timer Tokyo food map', 'Tokyo street at night', 'TRAVEL', 0.93, 'Tokyo Food Map', '{"location":"Tokyo, Japan","highlights":["Shibuya","Tsukiji outer market","TeamLab"]}', false, '{asia,food}', null, 'https://picsum.photos/seed/stash-tokyo/600/600', 'tokyoeats', now() - interval '17 days'),
  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-bali/', 'Quiet stays in Ubud', 'Ubud rice terraces', 'TRAVEL', 0.90, 'Ubud Slow Travel', '{"location":"Bali, Indonesia","highlights":["Rice terraces","Morning yoga","Local warungs"]}', true, '{wellness}', null, 'https://picsum.photos/seed/stash-bali/600/600', 'slowtravel', now() - interval '6 days'),

  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-neutral-home/', 'Warm neutral interior palette', 'Neutral living room aesthetic', 'AESTHETIC', 0.88, 'Warm Neutral Home', '{"style":"Japandi","mood":"Calm and minimal"}', false, '{interior}', null, 'https://picsum.photos/seed/stash-neutral/600/600', 'homeedit', now() - interval '19 days'),
  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-capsule-wardrobe/', 'Capsule wardrobe inspo', 'Neutral capsule clothing flat lay', 'AESTHETIC', 0.87, 'Capsule Wardrobe Inspo', '{"style":"Minimal","mood":"Clean and cohesive"}', false, '{fashion}', null, 'https://picsum.photos/seed/stash-capsule/600/600', 'stylestash', now() - interval '8 days'),

  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-random-1/', 'Cool photo not sure why I saved this', 'Abstract architecture photo', 'UNCATEGORIZED', 0.42, 'Untitled save', '{}', false, '{}', null, 'https://picsum.photos/seed/stash-random1/600/600', 'archivedaily', now() - interval '3 days'),
  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-random-2/', 'Save for later ???', 'Neon city street at night', 'UNCATEGORIZED', 0.38, 'Untitled save', '{}', false, '{}', null, 'https://picsum.photos/seed/stash-random2/600/600', 'nightwalks', now() - interval '2 days'),
  ('11111111-1111-1111-1111-111111111111', 'https://www.instagram.com/p/demo-random-3/', 'Need to figure out what this was', 'Coffee shop corner aesthetic', 'UNCATEGORIZED', 0.35, 'Untitled save', '{}', false, '{}', 'Sort this later.', 'https://picsum.photos/seed/stash-random3/600/600', 'coffeeshops', now() - interval '1 day')
on conflict (user_id, ig_url) do nothing;

-- Public demo collection
insert into public.collections (id, user_id, name, is_public, share_slug)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Weeknight Recipes',
  true,
  'weeknight-recipes'
)
on conflict (id) do nothing;

insert into public.collection_posts (collection_id, post_id)
select
  '22222222-2222-2222-2222-222222222222',
  p.id
from public.posts p
where p.user_id = '11111111-1111-1111-1111-111111111111'
  and p.category = 'RECIPE'
on conflict do nothing;

insert into public.activity_log (user_id, action, metadata) values
  ('11111111-1111-1111-1111-111111111111', 'SYNC_COMPLETE', '{"batch_size":27,"classified":24,"uncategorized":3}'),
  ('11111111-1111-1111-1111-111111111111', 'POST_CLASSIFIED', '{"batch_size":27}'),
  ('11111111-1111-1111-1111-111111111111', 'EXPORT_TRIGGERED', '{"type":"json"}');

-- posts_synced is maintained by trigger; force accurate count after seed
update public.users
set posts_synced = (
  select count(*) from public.posts
  where user_id = '11111111-1111-1111-1111-111111111111'
)
where id = '11111111-1111-1111-1111-111111111111';
