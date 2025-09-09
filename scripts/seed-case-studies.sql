-- EMIAC Technologies Case Studies Seed Data
-- This SQL file contains the initial data for the case studies dashboard

-- Insert Case Studies
INSERT INTO case_studies (
  id, client_name, industry, campaign_duration, start_date, end_date, is_active,
  traffic_growth, initial_traffic, final_traffic, keywords_ranked, backlinks_per_month,
  domain_rating_start, domain_rating_end, objective, challenge, solution, final_outcomes,
  serp_features, ai_overview, created_at, updated_at
) VALUES 
(
  'cs_mahindra_001',
  'Mahindra Auto',
  'Automotive',
  'Feb 2025 - Jul 2025 (200+ Days Activity & Ongoing)',
  '2025-02-01',
  '2025-07-31',
  true,
  78.09,
  18.17,
  32.37,
  3000,
  75,
  null,
  null,
  'Maximizing Mahindra Auto''s organic visibility and dominating search results for high-traffic keywords.',
  'The website traffic was stuck at around 18 Lac, with low engagement and limited keyword reach slowing growth.',
  'Through a well-crafted SEO strategy that included keyword research, guest posting, press releases, blog posts and effective link-building, we enhanced their digital visibility and performance.',
  '78.09% Growth in Organic Traffic, consistently rising every month. Ranking for 3000+ keywords in the top 3 positions. Secured 70-80 high-authority backlinks per month from trusted, niche-relevant domains. Online presence shaped by effective PR campaigns and valuable blogs. Improved crawl efficiency and indexing, resulting in new keywords being discovered in SERPs and Google AI Overview.',
  true,
  true,
  NOW(),
  NOW()
),
(
  'cs_protean_001',
  'Protean eGov Technologies',
  'Fintech/Government',
  'Jan 2025 - Jul 2025 (200+ Days Activity & Ongoing)',
  '2025-01-01',
  '2025-07-31',
  true,
  933.0,
  1.45,
  15.2,
  796,
  60,
  62,
  73,
  'To drive significant growth in Proteantech''s organic traffic and achieve top rankings for high-value traffic generating keywords.',
  'The website''s traffic was stagnant around 1 lac - 1.5 lac, affecting further growth and limiting keyword rankings in the top positions.',
  'Through a well-crafted SEO strategy that included keyword research, guest posting, and effective link-building, we enhanced their digital visibility and performance.',
  '933% Growth in Organic Traffic, consistently rising every month. Top 3 keyword rankings grew from 240 to 796 — a 231% rise. 50–70 high-quality backlinks/month from relevant, finance-related, trusted domains. Indexing and crawl efficiency enhanced leading to new keywords appearing in SERPs and Google''s AI Overview. Significant domain authority improvement from 62 to 73.',
  true,
  true,
  NOW(),
  NOW()
),
(
  'cs_upgrad_001',
  'UpGrad',
  'Education/EdTech',
  'Dec 2024 - May 2025 (100+ Days Activity)',
  '2024-12-01',
  '2025-05-31',
  true,
  51.86,
  5.84,
  8.87,
  3000,
  60,
  null,
  null,
  'Maximising UpGrad''s organic visibility and dominating search results for high-traffic keywords.',
  'The website traffic was stuck at 5.8 lac, with low engagement and limited keyword reach slowing growth.',
  'Through a well-crafted SEO strategy that included keyword research, guest posting, and effective link-building, we enhanced their digital visibility and performance.',
  '51.86% Growth in Organic Traffic, consistently rising every month. Currently ranking for 4.8 Lac+ keywords overall, including 3000+ keywords in the top 3 positions. Secured 50–70 high-authority backlinks per month from trusted, niche-relevant domains. Improved crawl efficiency and indexing, resulting in new keywords being discovered in SERPs and Google AI Overview.',
  true,
  true,
  NOW(),
  NOW()
);

-- Insert Monthly Data for Mahindra Auto
INSERT INTO monthly_data (id, case_study_id, month, traffic, keywords, backlinks, created_at) VALUES
('md_mahindra_001', 'cs_mahindra_001', 'Feb 2025', 18.17, 2500, 70, NOW()),
('md_mahindra_002', 'cs_mahindra_001', 'Mar 2025', 19.5, 2600, 75, NOW()),
('md_mahindra_003', 'cs_mahindra_001', 'Apr 2025', 22.1, 2700, 80, NOW()),
('md_mahindra_004', 'cs_mahindra_001', 'May 2025', 25.8, 2800, 75, NOW()),
('md_mahindra_005', 'cs_mahindra_001', 'Jun 2025', 28.9, 2900, 70, NOW()),
('md_mahindra_006', 'cs_mahindra_001', 'Jul 2025', 32.37, 3000, 75, NOW());

-- Insert Monthly Data for Protean eGov
INSERT INTO monthly_data (id, case_study_id, month, traffic, keywords, backlinks, created_at) VALUES
('md_protean_001', 'cs_protean_001', 'Jan 2025', 1.45, 240, 50, NOW()),
('md_protean_002', 'cs_protean_001', 'Feb 2025', 2.1, 280, 55, NOW()),
('md_protean_003', 'cs_protean_001', 'Mar 2025', 3.2, 320, 60, NOW()),
('md_protean_004', 'cs_protean_001', 'Apr 2025', 5.8, 450, 65, NOW()),
('md_protean_005', 'cs_protean_001', 'May 2025', 8.9, 580, 60, NOW()),
('md_protean_006', 'cs_protean_001', 'Jun 2025', 12.1, 680, 70, NOW()),
('md_protean_007', 'cs_protean_001', 'Jul 2025', 15.2, 796, 65, NOW());

-- Insert Monthly Data for UpGrad
INSERT INTO monthly_data (id, case_study_id, month, traffic, keywords, backlinks, created_at) VALUES
('md_upgrad_001', 'cs_upgrad_001', 'Dec 2024', 5.84, 2800, 55, NOW()),
('md_upgrad_002', 'cs_upgrad_001', 'Jan 2025', 6.2, 2850, 60, NOW()),
('md_upgrad_003', 'cs_upgrad_001', 'Feb 2025', 6.8, 2900, 65, NOW()),
('md_upgrad_004', 'cs_upgrad_001', 'Mar 2025', 7.4, 2950, 60, NOW()),
('md_upgrad_005', 'cs_upgrad_001', 'Apr 2025', 8.1, 2980, 70, NOW()),
('md_upgrad_006', 'cs_upgrad_001', 'May 2025', 8.87, 3000, 65, NOW());

-- Insert Keyword Data for Mahindra Auto
INSERT INTO keyword_data (id, case_study_id, keyword, jan_2025, feb_2025, mar_2025, apr_2025, may_2025, jun_2025, jul_2025, created_at) VALUES
('kd_mahindra_001', 'cs_mahindra_001', 'Bolero', 3, 2, 2, 2, 2, 1, 1, NOW()),
('kd_mahindra_002', 'cs_mahindra_001', 'Scorpio Classic', 3, 3, 2, 2, 1, 1, 1, NOW()),
('kd_mahindra_003', 'cs_mahindra_001', 'Thar', 2, 2, 2, 2, 2, 1, 1, NOW()),
('kd_mahindra_004', 'cs_mahindra_001', 'Scorpio S11', 30, 19, 15, 4, 3, 3, 3, NOW()),
('kd_mahindra_005', 'cs_mahindra_001', 'buy suv', 15, 19, 3, 3, 3, 3, 3, NOW()),
('kd_mahindra_006', 'cs_mahindra_001', 'best suv cars in india', 17, 27, 4, 4, 4, 4, 4, NOW()),
('kd_mahindra_007', 'cs_mahindra_001', 'small SUV', 25, 36, 19, 5, 5, 5, 5, NOW()),
('kd_mahindra_008', 'cs_mahindra_001', 'buy commercial vehicle', null, 15, null, 6, 5, 5, 5, NOW()),
('kd_mahindra_009', 'cs_mahindra_001', 'best crossover cars in india', 15, 30, 18, 8, 8, 8, 8, NOW());

-- Insert Keyword Data for Protean eGov
INSERT INTO keyword_data (id, case_study_id, keyword, jan_2025, feb_2025, mar_2025, apr_2025, may_2025, jun_2025, jul_2025, created_at) VALUES
('kd_protean_001', 'cs_protean_001', 'corporate nps benefits', null, null, null, 21, 9, 7, 1, NOW()),
('kd_protean_002', 'cs_protean_001', 'is nps good or bad', null, null, 34, 6, 1, 1, 1, NOW()),
('kd_protean_003', 'cs_protean_001', '80ccd 1b', null, null, 11, 6, 4, 5, 2, NOW()),
('kd_protean_004', 'cs_protean_001', 'name mismatch in pan card and aadhar card', null, null, 25, 25, 4, 3, 2, NOW()),
('kd_protean_005', 'cs_protean_001', 'nps vatsalya scheme tax benefit', null, null, 12, 12, 6, 5, 3, NOW()),
('kd_protean_006', 'cs_protean_001', 'which pension scheme is best', null, null, 30, 30, 13, 12, 3, NOW()),
('kd_protean_007', 'cs_protean_001', 'how to apply for pan card if lost', null, null, 32, 16, null, 15, 4, NOW()),
('kd_protean_008', 'cs_protean_001', 'enps account opening', null, null, 32, 11, 12, 10, 8, NOW());

-- Insert Keyword Data for UpGrad
INSERT INTO keyword_data (id, case_study_id, keyword, jan_2025, feb_2025, mar_2025, apr_2025, may_2025, jun_2025, jul_2025, created_at) VALUES
('kd_upgrad_001', 'cs_upgrad_001', 'highest paying courses in india', 3, 3, 1, 4, 1, 3, 1, NOW()),
('kd_upgrad_002', 'cs_upgrad_001', 'online data science course in india', 5, 1, 2, 3, 2, 1, 1, NOW()),
('kd_upgrad_003', 'cs_upgrad_001', 'doctor of business administration courses', null, 8, 8, 1, 18, 5, 1, NOW()),
('kd_upgrad_004', 'cs_upgrad_001', 'performance marketing course', 3, 2, 1, 1, 1, 6, 1, NOW()),
('kd_upgrad_005', 'cs_upgrad_001', 'data science course in india', 14, 13, 1, 8, 8, 1, 1, NOW()),
('kd_upgrad_006', 'cs_upgrad_001', 'online mba with placement', 46, 33, 27, 25, 30, 10, 3, NOW()),
('kd_upgrad_007', 'cs_upgrad_001', 'best online mba in india', 42, 61, 24, 6, 7, 4, 3, NOW()),
('kd_upgrad_008', 'cs_upgrad_001', 'cheapest online mba', 39, 7, 12, 5, 7, 3, 3, NOW()),
('kd_upgrad_009', 'cs_upgrad_001', 'best online mba courses in india', 30, 26, 12, 5, 8, 5, 3, NOW()),
('kd_upgrad_010', 'cs_upgrad_001', 'mba diploma courses', 25, 23, 16, 12, 7, 6, 3, NOW());

-- Insert SERP Features for Mahindra Auto
INSERT INTO serp_features (id, case_study_id, feature_type, keyword, url, position, created_at) VALUES
('sf_mahindra_001', 'cs_mahindra_001', 'AI Overview', 'xuv models', 'https://auto.mahindra.com/suv', 1, NOW()),
('sf_mahindra_002', 'cs_mahindra_001', 'AI Overview', 'xuv 700 features', 'https://auto.mahindra.com/blog/5-features-to-love-in-the-mahindra-xuv700.html', 1, NOW()),
('sf_mahindra_003', 'cs_mahindra_001', 'Featured Snippet', 'new scorpio classic', 'https://auto.mahindra.com/suv/scorpio-classic/SCRC.html', 1, NOW()),
('sf_mahindra_004', 'cs_mahindra_001', 'Featured Snippet', 'bolero india', 'https://auto.mahindra.com/suv/bolero/BOL.html', 1, NOW());

-- Insert SERP Features for Protean eGov
INSERT INTO serp_features (id, case_study_id, feature_type, keyword, url, position, created_at) VALUES
('sf_protean_001', 'cs_protean_001', 'Featured Snippet', 'ups vs nps', 'https://proteantech.in/articles/ops-vs-nps-vs-ups-retirement-plan-em1822025/', 1, NOW()),
('sf_protean_002', 'cs_protean_001', 'Featured Snippet', 'is nps good investment', 'https://proteantech.in/articles/NPS-vs-Other-Investments/', 1, NOW()),
('sf_protean_003', 'cs_protean_001', 'Featured Snippet', 'nps deduction in new tax regime', 'https://www.proteantech.in/articles/new-and-old-regime-06-05-2025/', 1, NOW());

-- Insert SERP Features for UpGrad
INSERT INTO serp_features (id, case_study_id, feature_type, keyword, url, position, created_at) VALUES
('sf_upgrad_001', 'cs_upgrad_001', 'AI Overview', 'online education courses', 'https://www.upgrad.com/blog/trending-courses-online/', 1, NOW()),
('sf_upgrad_002', 'cs_upgrad_001', 'AI Overview', 'data science online course', 'https://www.upgrad.com/data-science-course/', 1, NOW()),
('sf_upgrad_003', 'cs_upgrad_001', 'AI Overview', 'online pg courses', 'https://www.upgrad.com', 1, NOW()),
('sf_upgrad_004', 'cs_upgrad_001', 'Featured Snippet', 'highest paying courses in india', 'https://www.upgrad.com/blog/top-10-highest-paying-jobs-in-india/', 1, NOW()),
('sf_upgrad_005', 'cs_upgrad_001', 'Featured Snippet', 'online data science course in india', 'https://www.upgrad.com/data-science-course/', 1, NOW());
