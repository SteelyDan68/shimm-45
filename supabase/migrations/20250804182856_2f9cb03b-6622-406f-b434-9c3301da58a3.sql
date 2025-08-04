-- FULLSTÄNDIG FIX AV MESSAGING-SYSTEMET
-- 1. Först: Skapa alla saknade foreign keys på rätt sätt

-- Kontrollera tabellstruktur först
\d messages_v2;
\d conversations;
\d message_read_receipts;