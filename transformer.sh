#!/bin/bash

# command line arguments
FILES=$1
TOP_LEVEL_DIRECTORY=$2

# constant variables
TRANSFORMER=~/Projects/javascript-codemods/transforms/relative-to-absolute-import.js
DIRECTORIES='analytics,api-endpoint,attachments,auth,bootup,compose,compose-actions,conversations,device,dialog,download,drafts,drag-and-drop,editor,entitlements,errors,feedback,fetch,folders,form-helpers,hot-keys,internet-status,listpane,logging,mailbox-unread-count,mailboxes,message-body,message-list,message-recipients,message-search,migrate,move-to-folder,notification,notifypane,people,push,resize,search,settings,sidebar,snackbar,storage,team,themes,thread,thread-actions,thread-fetch,thread-list,thread-meta,thread-snooze,thread-toggle,thread-trash,token,types,ui,undo,updater,users,version,viewpane,viewpane-actions,window-compose,window-sync,workspace'
PREFIX='notion-modules/'

# transform files
jscodeshift -t $TRANSFORMER $FILES --parser=flow --topLevelDirectory=$TOP_LEVEL_DIRECTORY --directories=$DIRECTORIES --prefix=$PREFIX -d
