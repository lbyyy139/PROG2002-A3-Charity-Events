-- charityevents_db_cpanel.sql - PROG2002 A3 database, cPanel/import-ready variant
-- Author: Boyu Liu (24832407) · Xiang Hu
--
-- IMPORTANT: this version has NO CREATE/DROP DATABASE and NO USE statement.
-- In phpMyAdmin: select your database on the left FIRST, then Import this file,
-- so the tables are created inside the selected database.

-- charityevents_db.sql - PROG2002 A3 database (Author: Boyu Liu 24832407)
-- Import into MySQL:  mysql -u root -p < charityevents_db.sql
-- (or MySQL Workbench: Server > Data Import > Import from Self-Contained File)
-- A3 changes: new registrations table, latitude/longitude on events (Weather API).


-- Re-import safe: remove existing tables first (child tables before parents).
DROP TABLE IF EXISTS `registrations`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `organisations`;

-- Charitable organisations that host the events.
CREATE TABLE organisations (
    org_id        INT AUTO_INCREMENT PRIMARY KEY,
    org_name      VARCHAR(100)  NOT NULL,
    mission       TEXT          NOT NULL,
    description   TEXT          NULL,
    email         VARCHAR(100)  NOT NULL,
    phone         VARCHAR(30)   NOT NULL,
    address       VARCHAR(200)  NOT NULL,
    founded_year  INT           NOT NULL
);

-- Event types (separate table keeps categories reusable and consistent).
CREATE TABLE categories (
    category_id    INT AUTO_INCREMENT PRIMARY KEY,
    category_name  VARCHAR(50)   NOT NULL UNIQUE,
    description    VARCHAR(200)  NULL
);

-- The charity events shown on the website.
-- 'past' / 'upcoming' is derived from event_date vs the current date (not a column);
-- is_suspended = 1 hides a policy-violating event from the public pages;
-- goal_amount / raised_amount support the "Goal vs. Progress" display;
-- latitude / longitude feed the Open-Meteo weather forecast on the event page.
CREATE TABLE events (
    event_id      INT AUTO_INCREMENT PRIMARY KEY,
    event_name    VARCHAR(150)  NOT NULL,
    event_date    DATETIME      NOT NULL,
    end_date      DATETIME      NULL,
    location      VARCHAR(100)  NOT NULL,                -- city / suburb
    venue         VARCHAR(150)  NOT NULL,                -- full venue name
    description   TEXT          NOT NULL,
    purpose       TEXT          NOT NULL,                -- the cause it supports
    ticket_price  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    goal_amount   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    raised_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    image_url     VARCHAR(255)  NULL,
    latitude      DECIMAL(9,6)  NULL,                    -- for the Weather API
    longitude     DECIMAL(9,6)  NULL,                    -- for the Weather API
    org_id        INT           NOT NULL,
    category_id   INT           NOT NULL,
    is_suspended  TINYINT(1)    NOT NULL DEFAULT 0,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_events_org
        FOREIGN KEY (org_id) REFERENCES organisations (org_id),
    CONSTRAINT fk_events_category
        FOREIGN KEY (category_id) REFERENCES categories (category_id)
);

-- Event registrations (A3). One user may register for many events, but only
-- once per event - enforced by the UNIQUE (event_id, email) constraint.
-- The number of tickets purchased is stored in ticket_count.
CREATE TABLE registrations (
    registration_id   INT AUTO_INCREMENT PRIMARY KEY,
    event_id          INT           NOT NULL,
    full_name         VARCHAR(100)  NOT NULL,
    email             VARCHAR(100)  NOT NULL,
    phone             VARCHAR(30)   NOT NULL,
    ticket_count      INT           NOT NULL DEFAULT 1,
    registration_date TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reg_event
        FOREIGN KEY (event_id) REFERENCES events (event_id),
    CONSTRAINT uq_reg_event_email UNIQUE (event_id, email)
);

-- ============================================================================
-- Seed data. Dates are relative to CURDATE() so the dataset always contains
-- a realistic mix of "current / upcoming" and "past" events when imported.
-- ============================================================================

INSERT INTO organisations (org_name, mission, description, email, phone, address, founded_year) VALUES
('Hearts United Foundation',
 'Bringing our community together to fund local health, education and wellbeing programs that change lives.',
 'Hearts United Foundation is a registered non-profit organisation that has served our city for over fifteen years. We partner with local schools, hospitals and community groups to run fundraising events that fund meals for families in need, school supplies and medical research.',
 'info@heartsunited.org.au', '(07) 5520 1234', '12 Hope Street, Gold Coast QLD 4215', 2010),
('Bright Futures Charity',
 'Empowering young Australians through education, mentorship and sport.',
 'Bright Futures Charity focuses on giving every child a fair start. Our events raise money for scholarships, after-school programs and sports equipment for under-resourced schools across the region.',
 'hello@brightfutures.org.au', '(07) 5530 8899', '88 Learning Way, Gold Coast QLD 4222', 2014),
('Green Coast Trust',
 'Protecting and restoring our local environment through community action.',
 'Green Coast Trust organises tree plantings, clean-ups and awareness events. Every dollar raised goes directly to coastal restoration and wildlife protection projects.',
 'contact@greencoast.org.au', '(07) 5540 4567', '5 Ocean Parade, Gold Coast QLD 4217', 2016);

INSERT INTO categories (category_name, description) VALUES
('Fun Run', 'Sponsored walks and runs open to all fitness levels'),
('Gala Dinner', 'Formal black-tie dinners with auctions and guest speakers'),
('Silent Auction', 'Bid online or in person on donated items and experiences'),
('Concert', 'Live music performances with all proceeds donated'),
('Community Festival', 'Family-friendly outdoor festivals with food and activities');

-- 8 current / upcoming events ------------------------------------------------
INSERT INTO events (event_name, event_date, end_date, location, venue, description, purpose, ticket_price, goal_amount, raised_amount, image_url, latitude, longitude, org_id, category_id, is_suspended) VALUES
('Hope City Fun Run 5K',
 CURDATE() + INTERVAL 7 DAY + INTERVAL 8 HOUR,
 CURDATE() + INTERVAL 7 DAY + INTERVAL 11 HOUR,
 'Southport', 'Broadwater Parklands, Southport',
 'A beautiful 5 km or 10 km run along the Broadwater. All fitness levels are welcome, and every registration fee funds breakfast programs for local school children.',
 'School breakfast program for 500 local children',
 35.00, 50000.00, 31200.00, 'images/funrun.svg', -27.9683, 153.4100, 1, 1, 0),

('Hearts United Gala Dinner',
 CURDATE() + INTERVAL 21 DAY + INTERVAL 18 HOUR,
 CURDATE() + INTERVAL 21 DAY + INTERVAL 23 HOUR,
 'Surfers Paradise', 'Grand Ballroom, Paradise Hotel',
 'An elegant black-tie evening with a three-course dinner, live music and a live auction. Guest speakers include local medical researchers funded by last year''s event.',
 'Medical research into children''s heart conditions',
 150.00, 100000.00, 64500.00, 'images/gala.svg', -28.0023, 153.4145, 1, 2, 0),

('Art for Hearts Silent Auction',
 CURDATE() + INTERVAL 14 DAY + INTERVAL 17 HOUR,
 CURDATE() + INTERVAL 14 DAY + INTERVAL 20 HOUR,
 'Burleigh Heads', 'Burleigh Heads Community Centre',
 'Browse and bid on donated artworks, handmade crafts and unique experiences donated by local artists and businesses. Bidding closes at 8 pm on the night.',
 'Art therapy programs for hospital patients',
 0.00, 20000.00, 9800.00, 'images/auction.svg', -28.0906, 153.4536, 1, 3, 0),

('Bright Futures Charity Concert',
 CURDATE() + INTERVAL 30 DAY + INTERVAL 19 HOUR,
 CURDATE() + INTERVAL 30 DAY + INTERVAL 22 HOUR,
 'Robina', 'Robina Community Centre Theatre',
 'An evening of live music featuring local bands and a student orchestra, with raffle prizes and a gold-coin donation bar. All profits fund school scholarships.',
 'Ten annual scholarships for students in need',
 25.00, 15000.00, 11200.00, 'images/concert.svg', -28.0789, 153.3814, 2, 4, 0),

('Run for Bright Futures 10K',
 CURDATE() + INTERVAL 45 DAY + INTERVAL 7 HOUR,
 CURDATE() + INTERVAL 45 DAY + INTERVAL 10 HOUR,
 'Coolangatta', 'Coolangatta Beachfront',
 'A scenic coastal run with 2 km, 5 km and 10 km options, water stations, and medals for all finishers. Families and walkers are encouraged to join.',
 'Sports equipment for under-resourced schools',
 30.00, 25000.00, 5400.00, 'images/funrun.svg', -28.1667, 153.5333, 2, 1, 0),

('Coastal Clean-Up Festival',
 CURDATE() + INTERVAL 10 DAY + INTERVAL 9 HOUR,
 CURDATE() + INTERVAL 10 DAY + INTERVAL 14 HOUR,
 'Main Beach', 'Main Beach Foreshore',
 'A family-friendly festival combining a beach clean-up with live music, food trucks, and kids'' activities. Volunteers receive a free BBQ lunch and a reusable water bottle.',
 'Coastal dune restoration and wildlife protection',
 0.00, 8000.00, 6100.00, 'images/festival.svg', -27.9944, 153.4289, 3, 5, 0),

('Green Gala for the Bay',
 CURDATE() + INTERVAL 60 DAY + INTERVAL 18 HOUR,
 CURDATE() + INTERVAL 60 DAY + INTERVAL 23 HOUR,
 'Broadbeach', 'Ocean View Convention Centre',
 'A sustainable seafood-free gala dinner with plant-based menu, eco-raffle and keynote speakers from the marine conservation community.',
 'Seagrass meadow restoration in the local bay',
 120.00, 60000.00, 8900.00, 'images/gala.svg', -28.0345, 153.4312, 3, 2, 0),

('Sunrise Charity Walk',
 CURDATE() + INTERVAL 3 DAY + INTERVAL 6 HOUR,
 CURDATE() + INTERVAL 3 DAY + INTERVAL 9 HOUR,
 'Coomera', 'Coomera Riverwalk',
 'A gentle sunrise walk along the river followed by a community breakfast. Perfect for all ages, prams and dogs on leashes are welcome too.',
 'Community meals program for elderly residents',
 15.00, 5000.00, 4300.00, 'images/festival.svg', -27.8742, 153.3086, 1, 5, 0),

-- 2 past events (kept in the database; excluded from the home page by date) ---
('Winter Warmer Auction 2026',
 CURDATE() - INTERVAL 40 DAY + INTERVAL 17 HOUR,
 CURDATE() - INTERVAL 40 DAY + INTERVAL 20 HOUR,
 'Nerang', 'Nerang Bicentennial Hall',
 'Our winter silent auction raised funds for blankets and warm clothing drives. Thank you to everyone who bid and donated items.',
 'Winter blanket drive for homeless shelters',
 0.00, 12000.00, 13650.00, 'images/auction.svg', -27.9917, 153.3364, 1, 3, 0),

('Stars of Tomorrow Concert',
 CURDATE() - INTERVAL 70 DAY + INTERVAL 18 HOUR,
 CURDATE() - INTERVAL 70 DAY + INTERVAL 21 HOUR,
 'Southport', 'Southport Community Hall',
 'A showcase of young local musicians performing to a full house, with proceeds funding music lessons for children who cannot afford them.',
 'Free music lessons for 40 children',
 20.00, 8000.00, 8200.00, 'images/concert.svg', -27.9683, 153.4100, 2, 4, 0);

-- 1 suspended event (policy violation - must never appear on the website) ---
INSERT INTO events (event_name, event_date, end_date, location, venue, description, purpose, ticket_price, goal_amount, raised_amount, image_url, latitude, longitude, org_id, category_id, is_suspended) VALUES
('Mystery Mansion Night',
 CURDATE() + INTERVAL 5 DAY + INTERVAL 19 HOUR,
 CURDATE() + INTERVAL 5 DAY + INTERVAL 23 HOUR,
 'Southport', 'Undisclosed venue',
 'This event is currently suspended pending review of its fundraising licence and will not be shown on the website.',
 'Under review',
 75.00, 30000.00, 0.00, 'images/festival.svg', -27.9683, 153.4100, 1, 2, 1);

-- 10 sample registrations across the upcoming events --------------------------
-- registration_date is staggered so the event pages can demonstrate the
-- "sorted by latest purchase" ordering.
INSERT INTO registrations (event_id, full_name, email, phone, ticket_count, registration_date) VALUES
(1, 'Emily Carter',   'emily.carter@example.com',  '0412 345 678', 2, NOW() - INTERVAL 12 DAY),
(1, 'Jack Thompson',  'jack.thompson@example.com', '0423 456 789', 4, NOW() - INTERVAL 9 DAY),
(1, 'Sophie Nguyen',  'sophie.nguyen@example.com', '0434 567 890', 1, NOW() - INTERVAL 6 DAY),
(1, 'Liam Wilson',    'liam.wilson@example.com',   '0445 678 901', 3, NOW() - INTERVAL 2 DAY),
(2, 'Olivia Brown',   'olivia.brown@example.com',  '0456 789 012', 2, NOW() - INTERVAL 10 DAY),
(2, 'Noah Davis',     'noah.davis@example.com',    '0467 890 123', 6, NOW() - INTERVAL 7 DAY),
(3, 'Ava Miller',     'ava.miller@example.com',    '0478 901 234', 2, NOW() - INTERVAL 8 DAY),
(4, 'Ethan Anderson', 'ethan.anderson@example.com','0489 012 345', 2, NOW() - INTERVAL 5 DAY),
(6, 'Mia Taylor',     'mia.taylor@example.com',    '0490 123 456', 5, NOW() - INTERVAL 4 DAY),
(6, 'Lucas Martin',   'lucas.martin@example.com',  '0401 234 567', 2, NOW() - INTERVAL 1 DAY);
