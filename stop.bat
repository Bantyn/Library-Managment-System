@echo off
title PustakSetu - Stop All Services
color 0C
echo ===============================================================================
echo                STOPPING PUSTAKSETU SERVICES (PORTS 5000, 5173, 5174)
echo ===============================================================================
echo.

powershell -Command "
$ports = @(5000, 5173, 5174);
foreach ($p in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue;
    if ($conns) {
        $pids = $conns.OwningProcess | Select-Object -Unique;
        foreach ($procId in $pids) {
            try {
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue;
                Write-Host \"[STOPPED] Process ID $procId running on port $p\";
            } catch {}
        }
    } else {
        Write-Host \"[IDLE] No process listening on port $p\";
    }
}
"

echo.
echo All PustakSetu services have been stopped.
echo.
pause
