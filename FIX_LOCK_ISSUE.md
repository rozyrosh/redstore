# Fixing Next.js Lock File Issue

## Problem
"Unable to acquire lock at .next\dev\lock, is another instance of next dev running?"

## Solutions

### Solution 1: Remove Lock File (Already Done ✅)
The lock file has been removed. Try running `npm run dev` again.

### Solution 2: Kill Running Node Processes
If Solution 1 doesn't work, kill any running Node.js processes:

**In PowerShell:**
```powershell
# Find Node processes
Get-Process -Name node

# Kill all Node processes (be careful!)
Get-Process -Name node | Stop-Process -Force
```

**Or manually:**
1. Open Task Manager (Ctrl+Shift+Esc)
2. Go to "Details" tab
3. Find "node.exe" processes
4. Right-click → End Task

### Solution 3: Delete .next Directory
If the above doesn't work, delete the entire `.next` directory:

**In PowerShell:**
```powershell
cd C:\xampp\htdocs\redstore
Remove-Item -Recurse -Force .next
npm run dev
```

**Or manually:**
1. Close the terminal
2. Delete the `.next` folder in the project directory
3. Run `npm run dev` again

### Solution 4: Use Different Port
If another app is using port 3000:

```powershell
# Run on a different port
$env:PORT=3001; npm run dev
```

## Prevention
- Always stop the dev server properly with `Ctrl+C`
- Don't run multiple instances of `npm run dev` at the same time
- If the server crashes, remove the lock file before restarting

