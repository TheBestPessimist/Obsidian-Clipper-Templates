"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6580],{94475:function(e,t,a){a.d(t,{G:function(){return c}});var i=a(52322),r=a(72779),s=a.n(r),o=a(2784),n=a(19596),l=a(88169),d=a(86704);let c=e=>{let{palette:{baseColor:t}}=(0,o.useContext)(l.ThemeContext),{title:a,message:r,className:n,action:d,displayType:c}=e;return(0,i.jsx)(m,{className:s()(n,t),baseColor:"none",children:(0,i.jsxs)("div",{className:"inner",children:[(0,i.jsx)("div",{className:"title",role:"alert",children:a}),!!e.message&&(0,i.jsx)("div",{className:"message",role:"alert",children:r}),!!d&&(0,i.jsx)("compact"===c?u:p,{children:d})]})})},u=n.default.div.withConfig({componentId:"sc-46b1addd-0"})(["margin-top:",";"],d.spacing.s),p=n.default.div.withConfig({componentId:"sc-46b1addd-1"})(["margin-top:",";"],d.spacing.l),m=(0,n.default)(l.PageSection).withConfig({componentId:"sc-46b1addd-2"})([".inner{max-width:480px;margin:0 auto;text-align:center;}.message{margin-top:",";}&.base{.title{",";}.message{",";}}&.baseColor{.title{",";}.message{",";}}"],d.spacing.m,(0,d.setPropertyToColorVar)("color","ipt-on-base-textPrimary-color"),(0,d.setPropertyToColorVar)("color","ipt-on-base-textSecondary-color"),(0,d.setPropertyToColorVar)("color","ipt-on-baseAlt-textPrimary-color"),(0,d.setPropertyToColorVar)("color","ipt-on-baseAlt-textSecondary-color"))},64072:function(e,t,a){a.d(t,{w:function(){return r}});var i=a(10081);let r=(0,i.ZP)`
    fragment ImageListItemMetadata on Image {
        id
        url
        height
        width
        caption {
            plainText
        }
        names(limit: 4) {
            id
            nameText {
                text
            }
        }
        titles(limit: 1) {
            id
            titleText {
                text
            }
            originalTitleText {
                text
            }
            releaseYear {
                year
                endYear
            }
        }
    }
`},97149:function(e,t,a){a.d(t,{X:function(){return r}});var i=a(10081);let r=(0,i.ZP)`
    fragment VideoListItemMetadata on Video {
        id
        thumbnail {
            url
            width
            height
        }
        name {
            value
            language
        }
        description {
            value
            language
        }
        runtime {
            unit
            value
        }
        primaryTitle {
            id
            originalTitleText {
                text
            }
            titleText {
                text
            }
            titleType {
                canHaveEpisodes
            }
            releaseYear {
                year
                endYear
            }
        }
    }
`},93403:function(e,t,a){a.d(t,{_q:function(){return A},ZP:function(){return R}});var i=a(52322),r=a(27722),s=a(72779),o=a.n(s),n=a(2784),l=a(44778),d=a(19596),c=a(11438),u=a(14438);let p={CREDIT_CHANGE:c.Cd.FILMOGRAPHY,"CONTACT_CHANGE|CONTACT__RELATIONSHIP_TYPE|REPRESENTATION":c.Cd.REPRESENTATION,EMPLOYMENT_CHANGE:c.Cd.EMPLOYMENT,"CONTACT_CHANGE|CONTACT__RELATIONSHIP_TYPE|CLIENT":c.Cd.CLIENTS,NEWS_ADDITION:c.Cd.NEWS},m={TRACK:"Track",TRACKING:"Tracking",IS_LOADING:"Loading"};var T=a(17503),g=a(11602);let f=()=>{let[e,t]=(0,T.Z)(g.Vc),a=async e=>t(e);return{success:e.data?.untrackConst?.success,error:e.error,fetching:e.fetching,updateUntrackingForConst:a}},I=()=>{let[e,t]=(0,T.Z)(g.qb),a=async e=>t(e);return{success:e.data?.trackConst?.success,error:e.error,fetching:e.fetching,updateTrackingForConst:a}},C=e=>{let[t,a]=(0,n.useState)(e),[i,r]=(0,n.useState)(!1),{updateTrackingForConst:s}=I(),{updateUntrackingForConst:o}=f(),l=async e=>{if(!1===e.isTracking&&!1!==t.isTracking){r(!0);let e=await o({input:{id:t.id}}),i={...t,isTracking:!1};e.data?.untrackConst?.success&&a(i),r(!1)}else if(!0===e.isTracking&&!1===t.isTracking){r(!0);let e=t.notificationPreferences?.map(e=>({...e,interested:!0})),i=await s({input:{id:t.id,notificationTypeStates:e?.map(e=>{let{interested:t,type:a}=e;return{typeId:a.typeId,interested:t}})}});i.data?.trackConst?.success&&a({...t,isTracking:!0,notificationPreferences:e}),r(!1)}else if(!0===e.isTracking&&e.notificationPreferences!==t.notificationPreferences){r(!0);let i={...t,isTracking:!0,notificationPreferences:t.notificationPreferences?.map(t=>{let a=t;return e.notificationPreferences?.map(e=>{e.type.typeId===t.type.typeId&&e.interested!==t.interested&&(a=e)}),a})},o=await s({input:{id:t.id,notificationTypeStates:i.notificationPreferences?.map(e=>({typeId:e.type.typeId,interested:e.interested}))}});o.data?.trackConst?.success&&a(i),r(!1)}},d=m.IS_LOADING,c=t.isTracking?m.TRACKING:m.TRACK;return{state:t,updateTracking:l,isFetching:i,ariaLabel:i?d:c}};var h=a(54330),L=a(40076),_=a(9909),b=a(816);let x=e=>{let t=(0,b.A)(r.Button,{accessLevel:e.accessLevel,propsToOverride:["onClick","href","onSelect"]});return(0,i.jsx)(t,{...e})},E={TRACK:"Track",TRACKING:"Tracking",STOP_TRACKING:"Stop tracking"},P={track:"track",trackButton:"track-on",trackMenu:"track-menu-open"},A="protrackbutton--tracking--post-icon",S=e=>{let t,{id:a,data:s,buttonProps:d,buttonType:m="button",displayTrackOptionsMenu:T=!0,className:g}=e,f=(0,u.EO)(),{state:{isTracking:I,notificationPreferences:b},updateTracking:S,isFetching:R}=C({id:a,isTracking:s?.isTracking||!1,notificationPreferences:s?.notificationPreferences||[]}),[M,v]=(0,n.useState)(!1);(0,h.f1)();let O={className:o()(d?.className,T?void 0:g),onColor:void 0,accessLevel:"basic"};switch(m){case"secondaryButton":t=L.J,O.onColor="accent2";break;case"textButton":t=_.o,O.onColor="accent2";break;default:t=x}let j={},$=T?y:n.Fragment;T&&(j.className=g);let V=()=>f({pageAction:`${P.trackButton}-${a}`,refMarkerSuffix:c.Cd.EMPTY}),w=()=>f({pageAction:P.trackMenu,refMarkerSuffix:c.Cd.EMPTY}),D=()=>f({pageAction:`${P.track}-${c.Cd.OFF}-${a}`,refMarkerSuffix:c.Cd.MENU}),F=(e,t)=>{let a=p[e],i=t?c.Cd.OFF:c.Cd.ON;f({pageAction:`${a}-${i}`,refMarkerSuffix:c.Cd.MENU})};return(0,i.jsxs)($,{...j,children:[!!R&&(0,i.jsx)(t,{...d,...O,children:(0,i.jsx)(r.Loader,{})}),!R&&(0,i.jsx)(t,{onSelect:()=>{I?(w(),T?v(!M):S({isTracking:!1})):(V(),S({isTracking:!0}))},preIcon:I?"notifications-add-check":"notifications-add",postIcon:I&&T?"arrow":void 0,postIconClassName:I&&T?A:void 0,...d,...O,children:I?E.TRACKING:E.TRACK}),!!I&&!!T&&(0,i.jsx)(r.SetPalette,{palette:"light",children:(0,i.jsx)(N,{isVisible:M,mode:"absolute",expandFrom:"top-right",children:(0,i.jsx)(l.Y,{onEscapeKey:()=>v(!1),onClickOutside:()=>v(!1),children:(0,i.jsxs)(r.MenuList,{children:[b?.map(e=>{let{type:t,interested:a}=e;return i.jsx(k,{onClick:()=>{F(t.typeId,a),S({isTracking:!0,notificationPreferences:[{interested:!a,type:t}]})},preIconName:a?"checkbox-checked":"checkbox-unchecked",preIconProps:{name:a?"checkbox-checked":"checkbox-unchecked",spanClassName:"checkbox-icon"},children:t.text},t.text)}),(0,i.jsx)(r.MenuListDivider,{}),(0,i.jsx)(r.MenuListItem,{onClick:()=>{D(),v(!1),S({isTracking:!1})},children:E.STOP_TRACKING})]})})})})]})};var R=e=>(0,i.jsx)(c.xm,{value:c.Cd.TRACK,children:(0,i.jsx)(S,{...e})});let y=d.default.div.withConfig({componentId:"sc-7e41cf60-0"})(["position:relative;"]),k=(0,d.default)(r.MenuListItem).withConfig({componentId:"sc-7e41cf60-1"})([".checkbox-icon{","}"],(0,r.setPropertyToColorVar)("color","ipt-on-base-accent2-color")),N=(0,d.default)(r.Menu).withConfig({componentId:"sc-7e41cf60-2"})(["right:0;top:100%;"])},40076:function(e,t,a){a.d(t,{J:function(){return o}});var i=a(52322),r=a(27722);a(2784);var s=a(816);let o=e=>{let t=(0,s.A)(r.SecondaryButton,{accessLevel:e.accessLevel,propsToOverride:["href","onClick","onSelect"]});return(0,i.jsx)(t,{...e})}},96557:function(e,t,a){a.d(t,{Z:function(){return ee}});var i=a(52322),r=a(14973),s=a(88169),o=a(86704),n=a(10081),l=a(2784),d=a(46138),c=a(19596),u=a(31885),p=a(20608),m=a(84314),T=a(49666),g=a(49996),f=a(4363),I=a(66724),C=a(11438),h=a(37179),L=a(6935),_=a(67353),b=a(22619),x=a(25436),E=a(75808),P=a(66456),A=a(21014),S=a(86294);let R=(0,n.ZP)`
    fragment AddConstToListMenuItem on List {
        id
        name {
            originalText
        }
    }
`,y=e=>{let{listData:t,isElementInList:a,constId:r,listClass:o,onError:n,primaryText:c}=e,p=(0,d.Z)(),{value:m}=(0,C.Lz)(),f=(0,P.I)()??"",{onClick:h}=(0,A.k)(r,c??""),{listMainLinkBuilder:L,userCheckinsLinkBuilder:R,userFavoritePeopleLinkBuilder:y}=(0,I.WOb)(),{palette:{baseColor:k}}=(0,l.useContext)(s.ThemeContext),{pageType:N}=(0,g.y)(),V=(0,T.ik)()&&N===x.PageType.NAME,w=t.id,D=t.name?.originalText||"",F=p.formatMessage({id:"addConstToListMenuItem_goToList_ariaLabel",defaultMessage:"Go to list: {listTitle}"},{listTitle:D}),[H,G]=(0,l.useState)(a),{addConstToList:W,removeConstFromList:J}=(0,E.j8)({overrideRefTag:V?m+`_${w}`:m}),{addToWatchedTitles:Y}=(0,b.V)(),{executeAddConstToList:B,addConstToListResult:Z}=W,{executeRemoveConstFromList:K,removeConstFromListResult:U}=J,Q=Z?.error||U?.error,q=()=>{o===u.JQJ.FavoriteActors?(h(),G(!H)):H?(K(w,r),G(!1)):(B(w,r),G(!0),o===u.JQJ.CheckIns&&Y(r))},z=L({lsconst:w,refSuffix:C.Cd.EMPTY});return(o===u.JQJ.CheckIns?z=R({urconst:f,refSuffix:C.Cd.EMPTY}):o===u.JQJ.FavoriteActors&&(z=y({urconst:f,refSuffix:C.Cd.EMPTY})),Q)?(n(Q),null):(0,i.jsxs)(M,{className:k,children:[(0,i.jsxs)(v,{onClick:q,onKeyDown:e=>{(0,_.isEnterOrSpaceKey)(e)&&q()},role:"button",tabIndex:0,"data-titleinlist":H,className:k,children:[!!H&&(0,i.jsx)(j,{name:"playlist-add-check",className:k}),!H&&(0,i.jsx)(O,{name:"add"}),(0,S.ah)(t,p,!0)]}),(0,i.jsx)($,{href:z,"aria-label":F,className:k,children:(0,i.jsx)(s.Icon,{name:"chevron-right"})})]})};y.fragments={addConstToListMenuItem:R};let k=`
    &:focus {
        ${(0,o.focusOnBaseAlt)()}
    }

    &:hover {
        background: rgba(
            ${(0,o.getColorVarValue)("ipt-on-baseAlt-rgb")},
            ${(0,o.getColorVarValue)("ipt-baseAlt-hover-opacity")}
        );
        background: rgba(
            ${(0,o.getColorVar)("ipt-on-baseAlt-rgb")},
            ${(0,o.getColorVar)("ipt-baseAlt-hover-opacity")}
        );
    }

    &:active {
        background: rgba(
            ${(0,o.getColorVarValue)("ipt-on-baseAlt-rgb")},
            ${(0,o.getColorVarValue)("ipt-baseAlt-pressed-opacity")}
        );
        background: rgba(
            ${(0,o.getColorVar)("ipt-on-baseAlt-rgb")},
            ${(0,o.getColorVar)("ipt-baseAlt-pressed-opacity")}
        );
    }
`,N=`
    &:focus {
        ${(0,o.focusOnBase)()}
    }

    &:hover {
        background: rgba(
            ${(0,o.getColorVarValue)("ipt-on-base-rgb")},
            ${(0,o.getColorVarValue)("ipt-base-hover-opacity")}
        );
        background: rgba(
            ${(0,o.getColorVar)("ipt-on-base-rgb")},
            ${(0,o.getColorVar)("ipt-base-hover-opacity")}
        );
    }

    &:active {
        background: rgba(
            ${(0,o.getColorVarValue)("ipt-on-base-rgb")},
            ${(0,o.getColorVarValue)("ipt-base-pressed-opacity")}
        );
        background: rgba(
            ${(0,o.getColorVar)("ipt-on-base-rgb")},
            ${(0,o.getColorVar)("ipt-base-pressed-opacity")}
        );
    }
`,M=c.default.div.withConfig({componentId:"sc-20ab2378-0"})(["display:flex;align-items:center;width:100%;&.base{","}&.baseAlt{","}"],N,k),v=c.default.div.withConfig({componentId:"sc-20ab2378-1"})(["flex-grow:1;cursor:pointer;padding:0.75rem 1rem 0.75rem 0.75rem;position:relative;text-overflow:ellipsis;overflow:hidden;word-break:break-all;white-space:nowrap;&::after{position:absolute;content:'';right:0;top:20%;height:60%;width:1px;}&.base::after{","}&.baseAlt::after{","}"],(0,o.setPropertyToColorVar)("background-color","ipt-base-border-color"),(0,o.setPropertyToColorVar)("background-color","ipt-baseAlt-border-color")),O=(0,c.default)(s.Icon).withConfig({componentId:"sc-20ab2378-2"})(["margin-right:0.5rem;"]),j=(0,c.default)(O).withConfig({componentId:"sc-20ab2378-3"})(["&.base{","}&.baseAlt{","}"],(0,o.setPropertyToColorVar)("color","ipt-on-base-accent4-color"),(0,o.setPropertyToColorVar)("color","ipt-on-baseAlt-accent4-color")),$=c.default.a.withConfig({componentId:"sc-20ab2378-4"})(["padding:0.75rem 1rem;flex-shrink:0;&.base{"," ","}&.baseAlt{"," ","}"],(0,o.setPropertyToColorVar)("color","ipt-on-base-textHint-color"),N,(0,o.setPropertyToColorVar)("color","ipt-on-baseAlt-textHint-color"),k),V={PROMPT_TITLE:{id:"common_add_to_list_buttonText",defaultMessage:"Add to list"},CREATE_LIST:{id:"addConstToListPrompt_label_createList",defaultMessage:"Create new list"},ERROR_TITLE:{id:"error_emptyStates_addConstToList_title",defaultMessage:"There was a problem. Please try again."},VIEW_WATCHLIST:{id:"common_label_viewWatchlist",defaultMessage:"View Watchlist"},SIGNED_OUT_ERROR_TITLE:{id:"error_signedOut_addConstToList_title",defaultMessage:"Sign in to create or view a list."},CLOSE_PROMPT_LABEL:{id:"common_ariaLabel_closePrompt",defaultMessage:"Close Prompt"},NO_LISTS_FOUND:{id:"addConstToListPrompt_no_lists_found",defaultMessage:"No lists found"},NO_LISTS_FOUND_SEARCH:{id:"addConstToListPrompt_no_lists_found_search",defaultMessage:"No lists match your search"},SEARCH_LISTS_PLACEHOLDER:{id:"addConstToListPrompt_search_lists_placeholder",defaultMessage:"Search lists..."}},w={LOADER:"actlp-loader",ERROR:"actlp-error",CREATE_LIST:"actlp-creat-list",VIEW_WATCHLIST:"actlp-watchlist",NO_LIST:"actlp-no-list"},D="addConstToListPrompt__panel";var F=a(14438),H=a(1833),G=a(83163),W=a(48687),J=a(94475),Y=a(92543);let B=(0,n.ZP)`
    query ACTLP_Prompt(
        $count: Int!
        $constId: ID!
        $after: ID
        $listElementType: ListTypeId
        $classTypes: [ListClassId!]
    ) {
        lists(
            first: $count
            filter: {
                listElementType: $listElementType
                classTypes: $classTypes
            }
            after: $after
        ) {
            total
            edges {
                node {
                    ...AddConstToListMenuItem
                    isElementInList(itemElementId: $constId)
                    listClass {
                        id
                    }
                }
            }
            pageInfo {
                hasNextPage
                endCursor
            }
        }
    }
    ${y.fragments.addConstToListMenuItem}
`,Z={hasNextPage:!0,listItems:[],endCursor:null},K=e=>{let t,a,o;let{isOpen:n,onClose:c,primaryImage:_,primaryText:b,imageType:x}=e,E=_?.caption?.plainText||"",P=(0,m.n)(),A=(0,T.ik)(),S=(0,d.Z)(),{makeRefMarker:R}=(0,C.Lz)(),{listCreateLinkBuilder:k,listWatchlistLinkBuilder:N,registrationSignInLinkBuilder:M}=(0,I.WOb)(),v=(0,W.hg)({weblabID:G.lh.IMDB_FAVORITE_PEOPLE_1337000,treatments:{T1:!0,T2:!0}}),{pageType:O,pageConst:j}=(0,g.y)(),$=e.constId||j,J=$?.startsWith("tt"),K=$?.startsWith("nm"),ee=A?[u.JQJ.ProList]:[...v?[u.JQJ.FavoriteActors]:[],u.JQJ.CheckIns,u.JQJ.List],et=(0,F.EO)();(0,Y.g)(n);let ea="poster";J&&(t=u.lZo.Titles),K&&(t=u.lZo.People,ea="avatar");let[ei,er]=(0,l.useState)(Z),[es,eo]=(0,l.useState)(""),en=(0,l.useMemo)(()=>A&&es.trim()?ei.listItems.filter(e=>{let t=e.node?.name?.originalText||"";return K&&e?.node?.listClass?.id===u.JQJ.FavoriteActors?(a=e,!1):t.toLowerCase().includes(es.toLowerCase())}):ei.listItems,[ei.listItems,es,A]),[el]=(0,f.E)({query:B,requestPolicy:"network-only",variables:{constId:$,count:100,after:ei.endCursor,listElementType:t,classTypes:ee},context:{serverSideCacheable:!1,personalized:!0},pause:!n||!P||!$}),[ed,ec]=(0,l.useState)(void 0),eu=el.fetching,ep=el.error||ed,em=el.data?.lists?.total,eT=O&&$?(0,i.jsx)(s.TextLink,{href:M({refSuffix:[C.Cd.LIST,C.Cd.MENU],query:{u:`/${O}/${$}/`}}),text:S.formatMessage(V.SIGNED_OUT_ERROR_TITLE)}):null,eg=S.formatMessage(V.ERROR_TITLE);(0,l.useEffect)(()=>{n&&!eu&&el.data?.lists&&ei.hasNextPage&&er({listItems:el.data?.lists?.edges?ei.listItems.concat(el.data.lists.edges):ei.listItems,hasNextPage:el.data?.lists?.pageInfo?.hasNextPage,endCursor:el.data?.lists?.pageInfo?.endCursor})},[ei.hasNextPage,el.data]),(0,l.useEffect)(()=>{if(n){et({pageAction:h.QJ.ADD_TO_LIST_OPEN,hitType:r.HitType.POP_UP,refMarkerSuffix:C.Cd.EMPTY});return}er({...Z}),A&&eo("")},[n]);let ef=!ep&&n&&P&&em!==ei.listItems.length;return(0,i.jsxs)(U,{"data-testid":"styled-list-prompt",isOpen:n,onCloseClicked:()=>{c(),et({pageAction:h.QJ.ADD_TO_LIST_CLOSE,hitType:r.HitType.POP_UP,refMarkerSuffix:C.Cd.EMPTY})},panelClassName:D,baseColor:A?"base":"baseAlt",header:(0,i.jsx)(Q,{type:ea,subtitle:b,reverseTitleOrder:!0,title:S.formatMessage(V.PROMPT_TITLE),ariaLabel:E,imageModel:(0,L.K0)(_,E),imageType:x}),closePromptLabel:S.formatMessage(V.CLOSE_PROMPT_LABEL),children:[P?(0,i.jsxs)(s.MenuList,{children:[!!A&&(0,i.jsx)(s.MenuListDivider,{}),!!J&&!A&&(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(s.MenuListItem,{className:w.VIEW_WATCHLIST,"data-testid":w.VIEW_WATCHLIST,href:N({refSuffix:C.Cd.WATCHLIST}),postIconName:"chevron-right",children:(0,i.jsx)(p.q,{...V.VIEW_WATCHLIST})}),(0,i.jsx)(s.MenuListDivider,{})]}),(0,i.jsx)(s.MenuListItem,{className:w.CREATE_LIST,"data-testid":w.CREATE_LIST,href:A?(0,H.Ae)(`${H.Wr}/list/`,R(C.Cd.NEW),{}):k({refSuffix:C.Cd.NEW}),target:A?"_blank":void 0,postIconName:A?"launch":"chevron-right",children:(0,i.jsx)(p.q,{...V.CREATE_LIST})}),(0,i.jsx)(s.MenuListDivider,{}),!!A&&ei.listItems.length>0&&(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(X,{children:(0,i.jsx)(s.TextInput,{name:"listSearch",placeholder:S.formatMessage(V.SEARCH_LISTS_PLACEHOLDER),value:es,onChange:e=>eo(e.target.value),ariaLabel:"Search existing lists"})}),(0,i.jsx)(s.MenuListDivider,{})]}),!!ep&&(0,i.jsx)(q,{className:w.ERROR,"data-testid":w.ERROR,title:(o=ed,o?.graphQLErrors[0]?.extensions?.code==="FORBIDDEN")?eT:eg}),!ef&&0===ei.listItems.length&&!es.trim()&&(0,i.jsx)(q,{className:w.NO_LIST,"data-testid":w.NO_LIST,title:(0,i.jsx)(p.q,{...V.NO_LISTS_FOUND})}),!ef&&!!A&&ei.listItems.length>0&&0===en.length&&es.trim()&&(0,i.jsx)(q,{className:w.NO_LIST,"data-testid":w.NO_LIST,title:(0,i.jsx)(p.q,{...V.NO_LISTS_FOUND_SEARCH})}),!!K&&!A&&!!a&&!!$&&!!v&&(0,i.jsx)(i.Fragment,{children:(0,i.jsx)(y,{listData:a.node,listClass:a.node?.listClass?.id,isElementInList:a.node.isElementInList||!1,constId:$,onError:ec,primaryText:b},a.node.id)}),!ep&&!!$&&en.map(e=>(0,i.jsx)(y,{listData:e.node,listClass:e.node?.listClass?.id,isElementInList:e.node.isElementInList||!1,constId:$,onError:ec},e.node.id))]}):(0,i.jsx)(q,{className:w.ERROR,"data-testid":w.ERROR,title:eT}),!!ef&&(0,i.jsx)(z,{"data-testid":w.LOADER,children:(0,i.jsx)(s.Loader,{})})]})},U=(0,c.default)(s.Prompt).withConfig({componentId:"sc-3460fd7e-0"})([".","{padding:0;",";min-height:18rem;}"],D,(0,o.setPropertyToShapeVar)("border-radius","ipt-cornerRadius")),Q=(0,c.default)(s.PromptHeader).withConfig({componentId:"sc-3460fd7e-1"})([""," ",""],(0,o.setPropertyToShapeVar)("border-top-left-radius","ipt-cornerRadius"),(0,o.setPropertyToShapeVar)("border-top-right-radius","ipt-cornerRadius")),q=(0,c.default)(J.G).withConfig({componentId:"sc-3460fd7e-2"})([""," background:initial;min-height:7rem;padding:3rem;"],(0,o.setTypographyType)("body")),z=c.default.div.withConfig({componentId:"sc-3460fd7e-3"})(["display:flex;min-height:7rem;justify-content:center;padding:3rem;"]),X=c.default.div.withConfig({componentId:"sc-3460fd7e-4"})(["padding:",";background:initial;"],o.spacing.m);var ee=e=>(0,i.jsx)(C.xm,{value:C.Cd.LIST,children:(0,i.jsx)(K,{...e})})},35223:function(e,t,a){a.d(t,{TY:function(){return r},gA:function(){return s},z7:function(){return i}});let i={ADD_TO_LIST:"btp_atl",TRAILER:"btp_trlr",RETRY:"btp_ta",RATING_ROW:"btp_rt",RATING_DISPLAY:"btp_rt_ds",RATE_TRIGGER:"btp_rt_tg",METADATA_LIST:"btp_ml",GENRE_LIST:"btp_gl",PRODUCTION_STATUS:"btp_ps",SET_PREFERRED_SERVICES:"btp_sps"},r={ratingButtonRatedAriaLabel:{id:"common_ariaLabels_ratingButtonRated",defaultMessage:"Your rating: {rating}"},ratingButtonUnratedAriaLabel:{id:"common_ariaLabels_ratingButtonUnrated",defaultMessage:"Rate {titleName}"},ratingPromptRateLabel:{id:"common_ratingPrompt_rate",defaultMessage:"Rate"},closePrompt:{id:"common_ariaLabel_closePrompt",defaultMessage:"Close Prompt"},addToList:{id:"common_add_to_list_buttonText",defaultMessage:"Add to list"},trailer:{id:"common_buttons_trailer",defaultMessage:"Trailer"}},s="released"},4649:function(e,t,a){a.d(t,{a:function(){return c}});var i=a(52322),r=a(2784),s=a(46138),o=a(88169),n=a(63370),l=a(96557),d=a(35223);let c=e=>{let{title:t}=e,a=(0,s.Z)(),c=(0,n.K)({originalTitleText:t?.originalTitleText,titleText:t?.titleText}),[u,p]=(0,r.useState)(!1);return t&&c?(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(o.SecondaryButton,{width:"full-width",preIcon:"playlist-add-check","data-testid":d.z7.ADD_TO_LIST,onSelect:()=>p(!0),children:a.formatMessage(d.TY.addToList)}),(0,i.jsx)(l.Z,{constId:t.id,primaryImage:t.primaryImage,primaryText:c,imageType:"name",isOpen:u,onClose:()=>{p(!1)}})]}):null}},75808:function(e,t,a){a.d(t,{j8:function(){return I}});var i=a(10081),r=a(64072),s=a(88758),o=a(80032),n=a(36543),l=a(97149),d=a(25436),c=a(86958),u=a(49666),p=a(11438),m=a(14438),T=a(17503);let g="list-item-add",f="list-item-delete",I=e=>{let[t,a]=(0,T.Z)(C),[i,r]=(0,T.Z)(h),s=(0,c.B)().context,{makeRefMarker:o}=(0,p.Lz)(),n=(0,m.EO)(),l=(0,u.ik)()&&s.pageType===d.PageType.NAME,I=!!s.sidecar?.localizationResponse.isOriginalTitlePreferenceSet;return{addConstToList:{executeAddConstToList:(t,i)=>{let r=e.overrideRefTag??o([p.Cd.ADD,p.Cd.ITEMS]);return n({refMarkerString:r,pageAction:e.overrideAddPageAction??(l?`${g}-${i}`:g),customPageMetadata:{id:i}}),a({listId:t,constId:i,includeListItemMetadata:!!e.includeListItemMetadata,refTagQueryParam:r,originalTitleText:I})},addConstToListResult:t},removeConstFromList:{executeRemoveConstFromList:(t,a)=>(n({refMarkerString:e.overrideRefTag??o([p.Cd.DELETE,p.Cd.ITEMS]),pageAction:e.overrideRemovePageAction??(l?`${f}-${a}`:f),customPageMetadata:{id:a}}),r({listId:t,constId:a})),removeConstFromListResult:i}}},C=(0,i.ZP)`
    mutation AddConstToList(
        $listId: ID!
        $constId: ID!
        $includeListItemMetadata: Boolean!
        $refTagQueryParam: String
        $originalTitleText: Boolean
    ) {
        addItemToList(
            input: { listId: $listId, item: { itemElementId: $constId } }
        ) {
            listId
            modifiedItem {
                ...EditListItemMetadata
                listItem @include(if: $includeListItemMetadata) {
                    ... on Title {
                        ...TitleListItemMetadata
                    }
                    ... on Name {
                        ...NameListItemMetadata
                    }
                    ... on Image {
                        ...ImageListItemMetadata
                    }
                    ... on Video {
                        ...VideoListItemMetadata
                    }
                }
            }
        }
    }

    ${o.rc}
    ${n.Zz}
    ${s.E}
    ${r.w}
    ${l.X}
`,h=(0,i.ZP)`
    mutation RemoveConstFromList($listId: ID!, $constId: ID!) {
        removeElementFromList(
            input: { listId: $listId, itemElementId: $constId }
        ) {
            listId
        }
    }
`}}]);