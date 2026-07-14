-- Persistent, read-only starter plans shared by every authenticated workspace.
-- Durations are generic planning assumptions, not engineering or regulatory advice.

create table public.starter_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null,
  description text not null default '',
  estimated_duration_days integer not null,
  is_published boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint starter_templates_duration_check check (estimated_duration_days > 0),
  constraint starter_templates_version_check check (version > 0)
);

create table public.starter_template_tasks (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.starter_templates(id) on delete cascade,
  task_key text not null,
  phase text not null,
  type public.task_type not null default 'task',
  title text not null,
  description text not null default '',
  start_offset_days integer not null,
  duration_days integer not null,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  constraint starter_template_tasks_key_unique unique (template_id, task_key),
  constraint starter_template_tasks_sort_unique unique (template_id, sort_order),
  constraint starter_template_tasks_offset_check check (start_offset_days >= 0),
  constraint starter_template_tasks_duration_check check (duration_days > 0),
  constraint starter_template_tasks_sort_check check (sort_order >= 0)
);

create index starter_template_tasks_template_sort_idx
  on public.starter_template_tasks(template_id, sort_order);

create table public.starter_template_dependencies (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.starter_templates(id) on delete cascade,
  predecessor_task_id uuid not null references public.starter_template_tasks(id) on delete cascade,
  successor_task_id uuid not null references public.starter_template_tasks(id) on delete cascade,
  type public.dependency_type not null default 'FS',
  lag_working_days integer not null default 0,
  created_at timestamptz not null default now(),
  constraint starter_template_dependencies_unique unique (predecessor_task_id, successor_task_id, type),
  constraint starter_template_dependencies_no_self_check check (predecessor_task_id <> successor_task_id)
);

create index starter_template_dependencies_template_idx
  on public.starter_template_dependencies(template_id);

alter table public.starter_templates enable row level security;
alter table public.starter_template_tasks enable row level security;
alter table public.starter_template_dependencies enable row level security;

revoke all on table public.starter_templates from public, anon, authenticated;
revoke all on table public.starter_template_tasks from public, anon, authenticated;
revoke all on table public.starter_template_dependencies from public, anon, authenticated;

grant select on table public.starter_templates to authenticated, service_role;
grant select on table public.starter_template_tasks to authenticated, service_role;
grant select on table public.starter_template_dependencies to authenticated, service_role;

create policy "authenticated users can read published starter templates"
on public.starter_templates for select
to authenticated
using (is_published);

create policy "authenticated users can read published starter tasks"
on public.starter_template_tasks for select
to authenticated
using (
  exists (
    select 1
    from public.starter_templates template
    where template.id = template_id
      and template.is_published
  )
);

create policy "authenticated users can read published starter dependencies"
on public.starter_template_dependencies for select
to authenticated
using (
  exists (
    select 1
    from public.starter_templates template
    where template.id = template_id
      and template.is_published
  )
);

insert into public.starter_templates (
  slug,
  name,
  category,
  description,
  estimated_duration_days
)
values
  (
    'single-storey-house',
    'Single-storey house',
    'Residential',
    'A practical end-to-end starter plan for a detached one-level home, from brief and approvals through structure, services, finishes, commissioning, and handover.',
    198
  ),
  (
    'double-storey-house',
    'Double-storey house',
    'Residential',
    'A two-level home starter plan with separate structural stages for both floors, stairs, building services, finishes, external works, and handover.',
    272
  ),
  (
    'multi-storey-building',
    'Multi-storey building',
    'Commercial',
    'A generic multi-storey commercial building sequence covering design coordination, enabling works, substructure, repeated superstructure, envelope, MEP, fit-out, life safety, and commissioning.',
    656
  ),
  (
    'hospital-building',
    'Hospital building',
    'Healthcare',
    'A high-level healthcare facility plan that adds clinical planning, infection control, resilient utilities, medical gases, specialist rooms, integrated testing, approvals, training, and operational readiness.',
    800
  ),
  (
    'school-building',
    'School building',
    'Education',
    'A school delivery plan covering the educational brief, safe access, classrooms and specialist spaces, building services, external learning areas, commissioning, staff training, and handover.',
    522
  );

insert into public.starter_template_tasks (
  template_id,
  task_key,
  phase,
  type,
  title,
  description,
  start_offset_days,
  duration_days,
  sort_order
)
select
  template.id,
  task.task_key,
  task.phase,
  task.type::public.task_type,
  task.title,
  task.description,
  task.start_offset_days,
  task.duration_days,
  task.sort_order
from (
  values
    ('single-storey-house', 'brief', 'Planning', 'task', 'Confirm owner brief and project requirements', 'Record scope, room needs, quality expectations, target budget, responsibilities, and decision process.', 0, 5, 1),
    ('single-storey-house', 'surveys', 'Planning', 'task', 'Complete site survey and investigations', 'Confirm boundaries, levels, access, utilities, soil conditions, drainage constraints, and other site risks.', 5, 8, 2),
    ('single-storey-house', 'design-approvals', 'Design', 'task', 'Coordinate design, estimate, and approvals', 'Complete architectural and engineering coordination, cost check, permit submission, and approval actions.', 13, 20, 3),
    ('single-storey-house', 'procurement', 'Pre-construction', 'task', 'Procure long-lead materials and trades', 'Confirm trade packages and order items that could constrain the programme.', 33, 6, 4),
    ('single-storey-house', 'mobilize', 'Site works', 'task', 'Mobilize, secure, and set out the site', 'Install temporary controls and welfare, verify benchmarks, and set out the building.', 39, 5, 5),
    ('single-storey-house', 'excavation', 'Substructure', 'task', 'Excavate for foundations and services', 'Excavate safely to approved levels and prepare routes for below-ground services.', 44, 8, 6),
    ('single-storey-house', 'footings', 'Substructure', 'task', 'Construct footings and foundation walls', 'Complete reinforcement, inspections, concrete, foundation walls, and curing.', 52, 12, 7),
    ('single-storey-house', 'underslab', 'Substructure', 'task', 'Install below-slab services and moisture protection', 'Install drainage and service entries, compact fill, and complete termite/damp/waterproofing systems as required.', 64, 7, 8),
    ('single-storey-house', 'slab', 'Substructure', 'task', 'Place ground-floor slab', 'Complete reinforcement, embeds, inspection, concrete placement, finish, and curing.', 71, 7, 9),
    ('single-storey-house', 'walls-frame', 'Structure', 'task', 'Build walls and structural framing', 'Construct load-bearing walls, beams, columns, lintels, and structural framing to the approved design.', 78, 16, 10),
    ('single-storey-house', 'roof', 'Structure', 'task', 'Complete roof structure and weatherproofing', 'Install roof framing, membrane, coverings, flashings, drainage, and temporary weather protection.', 94, 12, 11),
    ('single-storey-house', 'openings', 'Envelope', 'task', 'Install external windows and doors', 'Complete openings, glazing, seals, thresholds, and water-tightness details.', 106, 9, 12),
    ('single-storey-house', 'mep-rough', 'Services', 'task', 'Complete MEP first fix', 'Install concealed electrical, plumbing, drainage, ventilation, and low-voltage rough-ins.', 115, 14, 13),
    ('single-storey-house', 'rough-inspection', 'Quality', 'task', 'Inspect structure and concealed services', 'Close required inspections and defects before walls and ceilings are covered.', 129, 5, 14),
    ('single-storey-house', 'linings', 'Interior', 'task', 'Install insulation, plaster, and internal linings', 'Complete insulation, air sealing, wall/ceiling linings, plastering, and drying.', 134, 12, 15),
    ('single-storey-house', 'wet-areas', 'Interior', 'task', 'Waterproof and tile wet areas', 'Prepare substrates, test waterproofing, and complete wall and floor tiling.', 146, 10, 16),
    ('single-storey-house', 'joinery', 'Interior', 'task', 'Install ceilings, joinery, and kitchen', 'Complete ceilings, internal doors, trim, cabinets, worktops, and fixed joinery.', 156, 11, 17),
    ('single-storey-house', 'finishes', 'Interior', 'task', 'Complete painting and floor finishes', 'Complete final decoration, flooring, skirtings, sealants, and protection.', 167, 9, 18),
    ('single-storey-house', 'mep-final', 'Services', 'task', 'Install and test final MEP fixtures', 'Install sanitaryware, lights, switches, outlets, equipment, and controls; test each system.', 176, 7, 19),
    ('single-storey-house', 'external', 'External works', 'task', 'Complete drainage, paths, and landscaping', 'Finish external services, levels, hardscape, drainage outlets, fencing, and basic landscaping.', 183, 8, 20),
    ('single-storey-house', 'handover', 'Closeout', 'task', 'Commission, rectify, document, and hand over', 'Complete functional checks, punch list, cleaning, approvals, manuals, training, keys, and handover records.', 191, 7, 21),

    ('double-storey-house', 'brief', 'Planning', 'task', 'Confirm owner brief and project requirements', 'Record scope, room needs, quality expectations, target budget, responsibilities, and decision process.', 0, 6, 1),
    ('double-storey-house', 'surveys', 'Planning', 'task', 'Complete site survey and investigations', 'Confirm boundaries, levels, access, utilities, soil conditions, drainage constraints, and other site risks.', 6, 9, 2),
    ('double-storey-house', 'design', 'Design', 'task', 'Complete coordinated architectural and engineering design', 'Coordinate architecture, structure, services, stairs, envelope, and code requirements.', 15, 24, 3),
    ('double-storey-house', 'approvals', 'Design', 'task', 'Secure permits and construction approvals', 'Submit the coordinated package and close authority review comments before dependent works.', 39, 12, 4),
    ('double-storey-house', 'procurement', 'Pre-construction', 'task', 'Procure long-lead materials and key trades', 'Lock trade packages and order structural, roofing, glazing, service, and finish items with long lead times.', 51, 7, 5),
    ('double-storey-house', 'mobilize', 'Site works', 'task', 'Mobilize, secure, and set out the site', 'Install temporary controls and welfare, verify benchmarks, and set out the building.', 58, 5, 6),
    ('double-storey-house', 'excavation', 'Substructure', 'task', 'Excavate for foundations and services', 'Excavate safely to approved levels and prepare below-ground service routes.', 63, 9, 7),
    ('double-storey-house', 'foundations', 'Substructure', 'task', 'Construct footings and foundations', 'Complete reinforcement, inspections, concrete, foundation walls, waterproofing, and curing.', 72, 14, 8),
    ('double-storey-house', 'ground-services', 'Substructure', 'task', 'Install below-slab services and prepare slab', 'Complete drainage, service entries, fill, compaction, moisture protection, reinforcement, and inspection.', 86, 9, 9),
    ('double-storey-house', 'ground-slab', 'Substructure', 'task', 'Place ground-floor slab', 'Place, finish, protect, and cure the approved ground-floor slab.', 95, 7, 10),
    ('double-storey-house', 'ground-structure', 'Structure', 'task', 'Construct ground-floor walls and frame', 'Complete ground-floor walls, columns, beams, lintels, and temporary support.', 102, 17, 11),
    ('double-storey-house', 'upper-floor', 'Structure', 'task', 'Construct upper-floor structure', 'Install the first-floor slab or joists, openings, edge protection, inspection, and curing.', 119, 12, 12),
    ('double-storey-house', 'upper-structure', 'Structure', 'task', 'Construct upper-floor walls and frame', 'Complete upper walls, columns, beams, lintels, and structural bracing.', 131, 16, 13),
    ('double-storey-house', 'stairs', 'Structure', 'task', 'Install permanent stair structure', 'Complete stair support, flights, landings, guarding provisions, and dimensional checks.', 147, 8, 14),
    ('double-storey-house', 'roof', 'Structure', 'task', 'Complete roof and weatherproofing', 'Install roof framing, membrane, coverings, flashings, and rainwater drainage.', 155, 13, 15),
    ('double-storey-house', 'envelope', 'Envelope', 'task', 'Complete external walls, windows, and doors', 'Complete facade layers, glazing, seals, thresholds, and water-shedding details.', 168, 14, 16),
    ('double-storey-house', 'mep-rough', 'Services', 'task', 'Complete MEP first fix on both levels', 'Install risers and concealed electrical, plumbing, ventilation, drainage, and low-voltage systems.', 182, 18, 17),
    ('double-storey-house', 'rough-inspection', 'Quality', 'task', 'Inspect structure, envelope, and concealed services', 'Close required inspections and defects before finishes conceal the work.', 200, 5, 18),
    ('double-storey-house', 'linings', 'Interior', 'task', 'Complete insulation, plaster, and internal linings', 'Complete air sealing, acoustic/fire stopping, wall and ceiling linings, plaster, and drying.', 205, 15, 19),
    ('double-storey-house', 'wet-areas', 'Interior', 'task', 'Waterproof and tile wet areas', 'Prepare, waterproof, test, and tile bathrooms, utility areas, and balconies as applicable.', 220, 11, 20),
    ('double-storey-house', 'joinery-finishes', 'Interior', 'task', 'Complete joinery, kitchen, painting, and floors', 'Install internal doors, cabinets, worktops, trim, decoration, flooring, and sealants.', 231, 16, 21),
    ('double-storey-house', 'mep-final', 'Services', 'task', 'Install and test final MEP fixtures', 'Complete fixtures, controls, sanitaryware, equipment, testing, and balancing.', 247, 8, 22),
    ('double-storey-house', 'external', 'External works', 'task', 'Complete external services and landscaping', 'Finish drainage, hardscape, fencing, utilities, site lighting, and basic landscaping.', 255, 9, 23),
    ('double-storey-house', 'handover', 'Closeout', 'task', 'Commission, rectify, document, and hand over', 'Complete punch list, functional checks, cleaning, approvals, manuals, training, and handover records.', 264, 8, 24),

    ('multi-storey-building', 'business-case', 'Planning', 'task', 'Confirm business case and project requirements', 'Define use, capacity, quality, budget, programme, operational requirements, stakeholders, and success measures.', 0, 10, 1),
    ('multi-storey-building', 'investigations', 'Planning', 'task', 'Complete surveys, utilities, and geotechnical investigations', 'Confirm boundaries, levels, utilities, access, contamination, groundwater, soil, and neighbouring constraints.', 10, 14, 2),
    ('multi-storey-building', 'concept', 'Design', 'task', 'Complete concept design and cost plan', 'Coordinate massing, structure, vertical transport, MEP strategy, fire strategy, facade, and cost plan.', 24, 24, 3),
    ('multi-storey-building', 'detailed-design', 'Design', 'task', 'Complete coordinated detailed design', 'Resolve multidisciplinary interfaces, specifications, buildability, logistics, and staged authority submissions.', 48, 36, 4),
    ('multi-storey-building', 'permits', 'Design', 'task', 'Secure major permits and authority clearances', 'Close planning, building, fire, environmental, utility, and traffic review actions needed for construction.', 84, 20, 5),
    ('multi-storey-building', 'procurement', 'Pre-construction', 'task', 'Procure main works and long-lead systems', 'Award key packages and release structure, facade, switchgear, generators, lifts, chillers, and specialist systems.', 104, 20, 6),
    ('multi-storey-building', 'enabling', 'Site works', 'task', 'Mobilize and complete enabling works', 'Secure the site, establish welfare/logistics, survey controls, diversions, demolition, and temporary works.', 124, 14, 7),
    ('multi-storey-building', 'excavation', 'Substructure', 'task', 'Complete excavation, shoring, and dewatering', 'Install and monitor excavation support, groundwater controls, haul routes, and formation protection.', 138, 24, 8),
    ('multi-storey-building', 'foundations', 'Substructure', 'task', 'Construct piles or raft foundations', 'Complete testing, reinforcement, embeds, concrete placement, curing, and foundation quality records.', 162, 28, 9),
    ('multi-storey-building', 'basement', 'Substructure', 'task', 'Construct basement and below-grade waterproofing', 'Complete retaining structure, slabs, joints, tanking, drainage, and water testing.', 190, 28, 10),
    ('multi-storey-building', 'podium', 'Structure', 'task', 'Construct podium and transfer structure', 'Complete heavy structural zones, embedded services, dimensional control, and staged striking.', 218, 22, 11),
    ('multi-storey-building', 'typical-frame', 'Structure', 'task', 'Construct repeated upper-floor frame', 'Run the approved floor cycle with reinforcement, embeds, concrete/steel erection, surveys, and quality checks.', 240, 60, 12),
    ('multi-storey-building', 'roof-plant', 'Structure', 'task', 'Complete roof, plant supports, and waterproofing', 'Complete roof structure, plant bases, penetrations, drainage, membrane, and flood testing.', 300, 18, 13),
    ('multi-storey-building', 'facade', 'Envelope', 'task', 'Install facade, glazing, and external doors', 'Close the envelope by zones and complete anchors, fire stops, air/water seals, and performance testing.', 318, 42, 14),
    ('multi-storey-building', 'vertical-transport', 'Building systems', 'task', 'Install lifts and vertical transport systems', 'Complete rails, cars, controls, interfaces, testing, certification, and rescue arrangements.', 360, 28, 15),
    ('multi-storey-building', 'mep-plant', 'Building systems', 'task', 'Install central MEP plant and utility connections', 'Install incoming utilities, major plant, switchgear, generators, pumps, tanks, controls, and plant-room services.', 388, 30, 16),
    ('multi-storey-building', 'mep-risers', 'Building systems', 'task', 'Complete MEP risers and distribution', 'Install risers, mains, busways, ducts, containment, fire stopping, and pressure/continuity tests.', 418, 34, 17),
    ('multi-storey-building', 'partitions', 'Fit-out', 'task', 'Complete partitions, ceilings, and fire compartmentation', 'Set out rooms, construct partitions, close shafts, complete fire/acoustic seals, and install ceiling systems.', 452, 34, 18),
    ('multi-storey-building', 'tenant-mep', 'Fit-out', 'task', 'Complete floor-level MEP rough-in', 'Install branch services, devices, controls, drainage, sprinklers, and coordinated above-ceiling work.', 486, 30, 19),
    ('multi-storey-building', 'finishes', 'Fit-out', 'task', 'Complete interior finishes and fixed furniture', 'Complete doors, joinery, sanitary areas, flooring, decoration, signage, and protection.', 516, 34, 20),
    ('multi-storey-building', 'life-safety', 'Life safety', 'task', 'Complete fire and life-safety systems', 'Complete detection, alarm, suppression, smoke control, egress, emergency lighting, and authority pretests.', 550, 20, 21),
    ('multi-storey-building', 'controls', 'Building systems', 'task', 'Integrate building controls and metering', 'Complete BMS, controls, energy metering, access control, CCTV, networks, and system interfaces.', 570, 18, 22),
    ('multi-storey-building', 'external', 'External works', 'task', 'Complete external works and utility tie-ins', 'Complete roads, drainage, hardscape, landscaping, site lighting, and permanent utility connections.', 588, 24, 23),
    ('multi-storey-building', 'commissioning', 'Commissioning', 'task', 'Test, balance, and commission all systems', 'Complete prefunctional checks, functional testing, balancing, integrated scenarios, defects, and witnessed results.', 612, 28, 24),
    ('multi-storey-building', 'handover', 'Closeout', 'task', 'Secure occupancy approvals and hand over', 'Close punch lists, compile as-builts/manuals, train operators, hand over spares, and complete occupancy approvals.', 640, 16, 25),

    ('hospital-building', 'clinical-brief', 'Planning', 'task', 'Confirm clinical brief and operational model', 'Define services, departments, patient flows, acuity, capacity, staffing, infection-control goals, and future flexibility.', 0, 18, 1),
    ('hospital-building', 'stakeholders', 'Planning', 'task', 'Validate workflows with clinical and facilities stakeholders', 'Map patient, staff, sterile, waste, material, emergency, and maintenance flows before design is fixed.', 18, 18, 2),
    ('hospital-building', 'site-investigations', 'Planning', 'task', 'Complete site, utility, and resilience investigations', 'Confirm access, emergency routes, utilities, geotechnical risks, flooding, contamination, and continuity constraints.', 36, 16, 3),
    ('hospital-building', 'concept', 'Design', 'task', 'Complete healthcare concept and room data requirements', 'Coordinate departments, adjacencies, room data, infection zones, equipment, structure, MEP capacity, and expansion.', 52, 32, 4),
    ('hospital-building', 'detailed-design', 'Design', 'task', 'Complete multidisciplinary and specialist design', 'Resolve medical planning, structure, architecture, MEP, medical gas, shielding, acoustics, ICT, security, and maintainability.', 84, 48, 5),
    ('hospital-building', 'regulatory', 'Design', 'task', 'Secure health, building, fire, and environmental approvals', 'Manage staged reviews with healthcare, planning, building, fire, utility, radiation, and environmental authorities.', 132, 24, 6),
    ('hospital-building', 'commissioning-plan', 'Commissioning', 'task', 'Finalize commissioning and validation plan', 'Define owner requirements, test scripts, witness points, infection-control validation, training, documentation, and acceptance criteria.', 156, 12, 7),
    ('hospital-building', 'procurement', 'Pre-construction', 'task', 'Procure main works and long-lead specialist systems', 'Release medical gases, generators, UPS, switchgear, chillers, air handlers, lifts, controls, imaging support, and specialist equipment interfaces.', 168, 24, 8),
    ('hospital-building', 'enabling', 'Site works', 'task', 'Mobilize and complete enabling works', 'Establish controlled logistics, temporary utilities, infection/dust controls where applicable, surveys, diversions, and site security.', 192, 18, 9),
    ('hospital-building', 'substructure', 'Substructure', 'task', 'Construct foundations and below-grade works', 'Complete excavation support, foundations, basement, waterproofing, below-grade drainage, testing, and quality records.', 210, 44, 10),
    ('hospital-building', 'structure', 'Structure', 'task', 'Construct primary structure and equipment support zones', 'Complete frame cycles, vibration-sensitive zones, heavy equipment bases, embeds, openings, surveys, and structural inspections.', 254, 70, 11),
    ('hospital-building', 'envelope', 'Envelope', 'task', 'Complete roof and weather-tight envelope', 'Install facade, roof, glazing, doors, seals, fire stops, and performance testing by zone.', 324, 44, 12),
    ('hospital-building', 'mep-plant', 'Building systems', 'task', 'Install resilient central MEP plant', 'Install redundant power, emergency generation, UPS, cooling/heating, water, pumps, tanks, controls, and maintainable plant access.', 368, 42, 13),
    ('hospital-building', 'mep-distribution', 'Building systems', 'task', 'Complete MEP risers and distribution', 'Install segregated normal/emergency power, ducts, pipes, containment, drainage, fire stopping, and monitoring points.', 410, 42, 14),
    ('hospital-building', 'medical-gas', 'Clinical systems', 'task', 'Install medical gas and vacuum systems', 'Install sources, manifolds, pipelines, valves, alarms, outlets, identification, pressure tests, and certification records.', 452, 28, 15),
    ('hospital-building', 'life-safety', 'Life safety', 'task', 'Complete fire, smoke-control, and emergency systems', 'Complete compartmentation, fire alarm, suppression, smoke control, egress, emergency lighting, refuge, and cause-and-effect programming.', 480, 26, 16),
    ('hospital-building', 'clinical-partitions', 'Fit-out', 'task', 'Complete clinical partitions, ceilings, and hygienic linings', 'Construct cleanable, sealed, fire/acoustic-rated rooms and ceilings with coordinated access and maintainability.', 506, 34, 17),
    ('hospital-building', 'specialist-rooms', 'Clinical systems', 'task', 'Fit out operating, imaging, laboratory, and isolation areas', 'Complete specialist shielding, surfaces, casework, booms, pressure regimes, controls, and equipment interfaces.', 540, 38, 18),
    ('hospital-building', 'general-fitout', 'Fit-out', 'task', 'Complete wards, clinics, support, and public areas', 'Complete doors, joinery, finishes, sanitary areas, wayfinding, protection, and accessibility provisions.', 578, 38, 19),
    ('hospital-building', 'ict-nurse-call', 'Clinical systems', 'task', 'Install ICT, nurse call, security, and communications', 'Complete structured cabling, clinical communication, nurse call, clocks, access control, CCTV, paging, and integrations.', 616, 28, 20),
    ('hospital-building', 'equipment', 'Clinical systems', 'task', 'Install and connect medical and operational equipment', 'Coordinate delivery, access, anchorage, power, cooling, gases, data, calibration, vendor testing, and asset records.', 644, 30, 21),
    ('hospital-building', 'hvac-validation', 'Validation', 'task', 'Balance HVAC and validate critical environments', 'Verify air quantities, filtration, pressure relationships, temperature/humidity, alarms, recovery, and room classifications.', 674, 24, 22),
    ('hospital-building', 'water-gas-validation', 'Validation', 'task', 'Validate water, drainage, and medical-gas quality', 'Complete flushing, disinfection, water-quality tests, drainage tests, gas identity/purity tests, and alarm verification.', 698, 18, 23),
    ('hospital-building', 'integrated-testing', 'Commissioning', 'task', 'Run integrated systems and failure-mode testing', 'Test normal/emergency power transitions, fire scenarios, controls, alarms, communications, lifts, and resilient operating modes.', 716, 22, 24),
    ('hospital-building', 'cleaning', 'Operational readiness', 'task', 'Complete builders clean and infection-control clean', 'Close dust-generating work, clean by approved zones, verify finishes, and protect spaces for equipment and occupancy.', 738, 12, 25),
    ('hospital-building', 'training', 'Operational readiness', 'task', 'Train clinical, facilities, and emergency teams', 'Deliver role-based training, drills, maintenance plans, spare parts, warranties, and controlled documentation.', 750, 16, 26),
    ('hospital-building', 'regulatory-inspection', 'Closeout', 'task', 'Complete healthcare and occupancy inspections', 'Close regulatory observations, validation evidence, licenses, certificates, and occupancy conditions.', 766, 16, 27),
    ('hospital-building', 'handover', 'Closeout', 'task', 'Complete phased handover and post-occupancy support', 'Transfer approved zones, records, assets, keys, training evidence, open-item controls, and early-life support arrangements.', 782, 18, 28),

    ('school-building', 'education-brief', 'Planning', 'task', 'Confirm educational brief and capacity', 'Define enrolment, teaching model, learning spaces, inclusion, safeguarding, community use, operations, budget, and programme.', 0, 14, 1),
    ('school-building', 'stakeholders', 'Planning', 'task', 'Engage educators, facilities, families, and community', 'Validate classroom, support, arrival, play, security, accessibility, maintenance, and shared-use needs.', 14, 12, 2),
    ('school-building', 'site-studies', 'Planning', 'task', 'Complete site, traffic, utility, and environmental studies', 'Confirm safe arrival routes, buses, parking, boundaries, noise, daylight, drainage, utilities, soil, and environmental constraints.', 26, 16, 3),
    ('school-building', 'design', 'Design', 'task', 'Complete coordinated school design and cost plan', 'Coordinate teaching spaces, specialist rooms, accessibility, safeguarding, structure, MEP, daylight, acoustics, energy, and cost.', 42, 38, 4),
    ('school-building', 'approvals', 'Design', 'task', 'Secure planning, building, fire, and education approvals', 'Submit and close authority comments, including safe access, fire strategy, accessibility, food service, and environmental items.', 80, 20, 5),
    ('school-building', 'commissioning-plan', 'Commissioning', 'task', 'Confirm commissioning and indoor-environment plan', 'Define owner requirements, test scripts, air-quality targets, controls training, seasonal testing, and acceptance evidence.', 100, 10, 6),
    ('school-building', 'procurement', 'Pre-construction', 'task', 'Procure main works and long-lead systems', 'Award key packages and release structure, facade, switchgear, air systems, kitchen, ICT, and specialist teaching equipment.', 110, 18, 7),
    ('school-building', 'mobilize', 'Site works', 'task', 'Mobilize and establish safe site logistics', 'Secure the site, separate construction from neighbours or operating campuses, and establish welfare, deliveries, and controls.', 128, 12, 8),
    ('school-building', 'substructure', 'Substructure', 'task', 'Construct foundations, drainage, and ground floor', 'Complete excavation, foundations, below-slab services, moisture protection, slab, testing, and quality records.', 140, 34, 9),
    ('school-building', 'structure', 'Structure', 'task', 'Construct primary structure', 'Complete frame, stairs, roof supports, openings, surveys, inspections, and temporary stability.', 174, 44, 10),
    ('school-building', 'envelope', 'Envelope', 'task', 'Complete roof and weather-tight envelope', 'Install facade, roof, glazing, external doors, insulation, fire stops, and air/water seals.', 218, 34, 11),
    ('school-building', 'mep', 'Building systems', 'task', 'Install MEP plant, distribution, and controls', 'Complete utilities, electrical, lighting, ventilation, heating/cooling, water, drainage, metering, and accessible controls.', 252, 40, 12),
    ('school-building', 'partitions', 'Fit-out', 'task', 'Complete partitions, ceilings, and acoustic treatments', 'Form classrooms and support rooms with required fire, acoustic, impact, access, and display provisions.', 292, 26, 13),
    ('school-building', 'learning-spaces', 'Fit-out', 'task', 'Fit out classrooms, library, administration, and support rooms', 'Complete durable finishes, fixed storage, teaching walls, accessibility details, signage, and furniture interfaces.', 318, 28, 14),
    ('school-building', 'specialist-spaces', 'Fit-out', 'task', 'Fit out laboratories, arts, technology, and multipurpose spaces', 'Complete specialist services, extraction, safety equipment, acoustic treatments, storage, and equipment interfaces.', 346, 26, 15),
    ('school-building', 'food-sports', 'Fit-out', 'task', 'Complete kitchen, dining, and sports facilities', 'Complete hygienic finishes, kitchen equipment interfaces, changing/toilet areas, sports fittings, and safety provisions.', 372, 24, 16),
    ('school-building', 'ict-security', 'Building systems', 'task', 'Install ICT, fire alarm, security, and communications', 'Complete networks, classroom technology, access control, intrusion/CCTV, public address, clocks, and emergency communications.', 396, 22, 17),
    ('school-building', 'external', 'External works', 'task', 'Complete safe access, play, sports, and landscape works', 'Complete drop-off, paths, accessible routes, fencing, play surfaces, sports areas, drainage, shade, planting, and site lighting.', 418, 30, 18),
    ('school-building', 'testing', 'Commissioning', 'task', 'Test and commission building systems', 'Complete functional testing, balancing, lighting controls, metering, alarms, safety systems, and witnessed results.', 448, 22, 19),
    ('school-building', 'iaq', 'Commissioning', 'task', 'Complete indoor-air-quality flush-out and verification', 'Finish pollutant-producing work, flush or test spaces as specified, replace filters, and verify ventilation readiness.', 470, 12, 20),
    ('school-building', 'training', 'Operational readiness', 'task', 'Train school and facilities staff', 'Train users on controls, security, emergency systems, specialist spaces, maintenance, warranties, and issue reporting.', 482, 12, 21),
    ('school-building', 'inspection', 'Closeout', 'task', 'Complete safety, accessibility, and occupancy inspections', 'Close authority observations, certificates, safeguarding checks, accessibility items, and occupancy conditions.', 494, 14, 22),
    ('school-building', 'handover', 'Closeout', 'task', 'Complete handover and early-life support', 'Close punch lists, deliver as-builts/manuals/assets/keys, support move-in, and plan seasonal/post-occupancy review.', 508, 14, 23)
) as task(
  template_slug,
  task_key,
  phase,
  type,
  title,
  description,
  start_offset_days,
  duration_days,
  sort_order
)
join public.starter_templates template on template.slug = task.template_slug;

-- Add a straightforward finish-to-start chain. Users can adjust or remove links
-- after creating a project; the starter catalog itself remains immutable.
insert into public.starter_template_dependencies (
  template_id,
  predecessor_task_id,
  successor_task_id,
  type,
  lag_working_days
)
select
  sequenced.template_id,
  sequenced.predecessor_task_id,
  sequenced.successor_task_id,
  'FS',
  0
from (
  select
    template_id,
    id as predecessor_task_id,
    lead(id) over (partition by template_id order by sort_order) as successor_task_id
  from public.starter_template_tasks
) sequenced
where sequenced.successor_task_id is not null;
