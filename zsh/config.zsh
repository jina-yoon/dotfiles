export EDITOR='vim'

HISTFILE=~/.zsh_history
HISTSIZE=50000
SAVEHIST=50000

setopt HIST_IGNORE_ALL_DUPS   # don't record a duplicate of the previous command
setopt HIST_REDUCE_BLANKS     # trim superfluous whitespace
setopt SHARE_HISTORY          # share history between open shells
setopt AUTO_CD                # `foo` instead of `cd foo`
