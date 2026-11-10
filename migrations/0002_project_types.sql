ALTER TABLE projects
ADD COLUMN project_type TEXT NOT NULL
DEFAULT '{"value":{"vi":"Lập trình","en":"Coding"},"visibility":"public"}';

UPDATE projects
SET project_type = '{"value":{"vi":"Âm nhạc","en":"Music"},"visibility":"public"}'
WHERE json_extract(name, '$.value.vi') = 'Music-app';
