# Enable Powerlevel10k instant prompt. Should stay close to the top of ~/.zshrc.
# Initialization code that may require console input (password prompts, [y/n]
# confirmations, etc.) must go above this block; everything else may go below.
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# To customize prompt, run `p10k configure` or edit ~/.p10k.zsh.
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh

# Plugins
source ~/.oh-my-zsh/custom/themes/powerlevel10k/powerlevel10k.zsh-theme
source ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh
source ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

# NVM
export NVM_NO_USE=false
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# PNPM
export PNPM_HOME="/root/.local/share/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac

# Golang
export GOPATH=$HOME/go
export PATH=$PATH:/usr/local/go/bin:$GOPATH/bin

# Rust
export PATH=$PATH:$HOME/.cargo/bin

# Zoxide
export PATH=$PATH:/root/.local/bin:/root/.local/bin/zoxide
eval "$(zoxide init zsh)"

# FZF
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh
export FZF_DEFAULT_OPTS=" \
  --style default \
  --walker-skip .git,node_modules,dist,coverage \
  --preview 'batcat -n --color=always {}' \
  --bind 'ctrl-/:change-preview-window(down|hidden|)'"

# Pulumi
export PATH=$PATH:/root/.pulumi/bin

# SSH
export SSH_AUTH_SOCK="$XDG_RUNTIME_DIR/ssh-agent.socket"

if ssh-add -l >/dev/null 2>&1; then
  :
else
  ssh-add ~/.ssh/id_ed25519_work
  ssh-add ~/.ssh/id_ed25519_personal
fi

# Aliases
alias zsh="code $HOME/.zshrc"
alias up="source $HOME/.zshrc"
alias nopoly="npx nolyfill install; pnpm install"

alias cls="clear"
alias ls="eza --icons=never --color=never --classify=always --group-directories-first"
alias cd="z"
alias my="my-cli"
alias wgit="~/scripts/test-github-credentials.sh"
alias gemini="gemini -m gemini-2.5-flash"
alias lint="npx biome check --write --unsafe"
alias format-db="npx prettier --ignore-path=.gitignore --write /home/orochaa/git/unvoid/when/packages/api/src/database/ && npx @biomejs/biome format --write /home/orochaa/git/unvoid/when/packages/api/src/database/"

# Keybindings
# Home
bindkey '^[[H' beginning-of-line
# End
bindkey '^[[F' end-of-line
# Ctrl + Left Arrow
bindkey '^[[1;5D' backward-word
# Ctrl + Right Arrow
bindkey '^[[1;5C' forward-word
# Delete
bindkey '^[[3~' delete-char
# Ctrl + Backspace
bindkey '^W' backward-kill-word
# Ctrl + Delete
bindkey '^[[3;5~' kill-word

# Functions
turboc() {
  TURBO_TELEMETRY_DISABLED=1 npx turbo run "$1" --filter="@lib/$2"
}

pnpmc() {
  pnpm --filter @lib/$2 run $1
}