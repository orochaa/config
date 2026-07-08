#!/usr/bin/env bash
set -euo pipefail

mapfile -t files < <(git diff --name-only --diff-filter=U)

((${#files[@]})) || { echo "No merge conflicts."; exit 0; }

process_file() {
    local file=$1

    echo
    echo "$file"
    select action in ours theirs manual; do
        case "${action:-}" in
            ours)
                git checkout --ours -- "$file"
                git add -- "$file"
                break
                ;;
            theirs)
                git checkout --theirs -- "$file"
                git add -- "$file"
                break
                ;;
            manual)
                break
                ;;
        esac
    done
}

echo "Process by:"
select mode in folders files; do
    [[ -n ${mode:-} ]] && break
done

if [[ $mode == folders ]]; then
    mapfile -t dirs < <(
        printf '%s\n' "${files[@]}" |
            xargs -n1 dirname |
            sort -u
    )

    mapfile -t dirs < <(
        printf '%s\n' "${dirs[@]}" | awk '
            { d[NR] = $0 }
            END {
                for (i = 1; i <= NR; ++i) {
                    leaf = 1
                    for (j = 1; j <= NR; ++j) {
                        if (i != j && index(d[j], d[i] "/") == 1) {
                            leaf = 0
                            break
                        }
                    }
                    if (leaf) print d[i]
                }
            }'
    )

    for dir in "${dirs[@]}"; do
        echo
        echo "=== $dir ==="

        select action in ours theirs per-file manual; do
            case "${action:-}" in
                ours|theirs)
                    for file in "${files[@]}"; do
                        [[ $(dirname "$file") == "$dir" ]] || continue
                        git checkout "--$action" -- "$file"
                        git add -- "$file"
                    done
                    break
                    ;;
                per-file)
                    for file in "${files[@]}"; do
                        [[ $(dirname "$file") == "$dir" ]] && process_file "$file"
                    done
                    break
                    ;;
                manual)
                    break
                    ;;
            esac
        done
    done
else
    for file in "${files[@]}"; do
        process_file "$file"
    done
fi