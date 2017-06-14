#!/bin/bash

# command line arguments
SCRIPT_NAME=$0
FILES=$1
ROOT_DIRECTORY=$2

# get script directory from script name
SCRIPT_DIRECTORY=$(dirname $SCRIPT_NAME)

# constant variables
TRANSFORMER=$SCRIPT_DIRECTORY/transforms/relative-to-absolute-import.js
DIRECTORIES='analytics,api-endpoint,attachments,auth,bootup,compose,compose-actions,conversations,device,dialog,download,drafts,drag-and-drop,editor,entitlements,errors,feedback,fetch,folders,form-helpers,hot-keys,internet-status,listpane,logging,mailbox-unread-count,mailboxes,message-body,message-list,message-recipients,message-search,migrate,move-to-folder,notification,notifypane,people,push,resize,search,settings,sidebar,snackbar,storage,team,themes,thread,thread-actions,thread-fetch,thread-list,thread-meta,thread-snooze,thread-toggle,thread-trash,token,types,ui,undo,updater,users,version,viewpane,viewpane-actions,window-compose,window-sync,workspace,compat,electron-util,util'
PREFIX='notion-modules/'

# transform files
jscodeshift -t $TRANSFORMER $FILES --parser=flow --rootDirectory=$ROOT_DIRECTORY --directories=$DIRECTORIES --prefix=$PREFIX -d -p
