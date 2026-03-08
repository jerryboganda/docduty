<?php

if ($argc !== 2) {
    fwrite(STDERR, "Usage: sqlite_export.php <sqlite-db-path>\n");
    exit(1);
}

$dbPath = realpath($argv[1]);
if ($dbPath === false || !file_exists($dbPath)) {
    fwrite(STDERR, "SQLite database not found: {$argv[1]}\n");
    exit(1);
}

$db = new SQLite3($dbPath, SQLITE3_OPEN_READONLY);
$tablesResult = $db->query("
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
");

$payload = ['tables' => []];
while ($tableRow = $tablesResult->fetchArray(SQLITE3_ASSOC)) {
    $tableName = $tableRow['name'];
    $rowsResult = $db->query('SELECT * FROM "' . str_replace('"', '""', $tableName) . '"');
    $rows = [];
    while ($row = $rowsResult->fetchArray(SQLITE3_ASSOC)) {
        $rows[] = $row;
    }
    $payload['tables'][$tableName] = $rows;
}

echo json_encode($payload, JSON_UNESCAPED_UNICODE);
