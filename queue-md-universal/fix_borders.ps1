$pagesDir = "c:\Users\Prakash Max\OneDrive\Desktop\QueueMD\queue-md-universal\client\src\pages"

$files = Get-ChildItem -Path $pagesDir -Filter "*.jsx"

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    
    $original = $content

    # Replace border classes - avoid double-adding dark: prefix
    $content = $content -replace 'border border-border-muted/50(?! dark:)', 'border border-border-muted/50 dark:border-white/5'
    $content = $content -replace 'border-b border-border-muted/50(?! dark:)', 'border-b border-border-muted/50 dark:border-white/5'
    $content = $content -replace 'border-t border-border-muted/50(?! dark:)', 'border-t border-border-muted/50 dark:border-white/5'
    $content = $content -replace 'border border-border-muted/30(?! dark:)', 'border border-border-muted/30 dark:border-white/5'
    $content = $content -replace 'border-b border-border-muted/30(?! dark:)', 'border-b border-border-muted/30 dark:border-white/5'
    $content = $content -replace 'border-t border-border-muted/30(?! dark:)', 'border-t border-border-muted/30 dark:border-white/5'

    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Fixed: $($file.Name)"
    } else {
        Write-Host "No changes: $($file.Name)"
    }
}

Write-Host "Done!"
