// ----------------------------------------------------------------------------------
// REPflare - v1.0.0
// ref.: https://github.com/Darkseal/REPflare
// A lightweight Cloudflare Worker to replace text and inject styles and scripts in any web page
// ----------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------
// CONFIGURATION SETTINGS
// ----------------------------------------------------------------------------------

// set this to TRUE to use RegEx, FALSE otherwise
const textReplacement_useRegex = true;

// set this to TRUE to perform the replacement in a case-insensitive way, FALSE otherwise
const textReplacement_caseInsensitive = true;

// Text replacement configuration ( 'sourceText' : 'replacementText' )

var textReplacementRules = {
  
}

// Script injection configuration ( 'sourceScriptElement' : position )

// Position can be set as follows:
// 0: at the beginning of <header> element ( first child of <head> )
// 1: at the end of <header> element  ( right before </head> )
// 2: at the beginning of <body> element ( first child of <body> )
// 3: at the end of <body> element ( right before </body> )

var scriptInjectionRules = {
};

// ----------------------------------------------------------------------------------
// MAIN CODE
// ----------------------------------------------------------------------------------

addEventListener('fetch', event => {
    event.passThroughOnException();
    event.respondWith(handleRequest(event.request));
})

async function handleRequest(request) {
    var rurl = new URL(request.url);
    var response;
    if (rurl.origin == "http://127.0.0.1:8787" || rurl.origin == "https://listenr-metatag-injector.cukmekerb-cloudflare.workers.dev") {
     response = await fetch("https://listenr.gq/view.html?AetBh69feedbH=aHR0cHM6Ly9hbmNob3IuZm0vcy80YzUwNTJkNC9wb2RjYXN0L3Jzcw==");
     rurl = new URL("https://listenr.gq/view.html?AetBh69feedbH=aHR0cHM6Ly9hbmNob3IuZm0vcy80YzUwNTJkNC9wb2RjYXN0L3Jzcw==");
    }
    else {
     response = await fetch(rurl.origin + rurl.pathname);
    }
    var html = await response.text();
    var url_params = rurl.searchParams;
    var script_to_inject = "";
    if (url_params.get("AetBh69feedbH") == null) {
      script_to_inject = `<meta name="description" content="The simplest podcatcher of them all">
    <meta name="image" content="icon-512.png">
    <meta itemprop="name" content="Listenr">
    <meta itemprop="description" content="The simplest podcatcher of them all">
    <meta itemprop="image" content="icon-512.png">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="Listenr">
    <meta name="twitter:description" content="The simplest podcatcher of them all">
    <meta name="twitter:image:src" content="icon-512.png">
    <meta name="og:title" content="Listenr">
    <meta name="og:description" content="The simplest podcatcher of them all">
    <meta name="og:image" content="icon-512.png">
    <meta name="og:url" content="https://listenr.gq/">
    <meta name="og:site_name" content="Listenr">`
      
    }
    else {
      var data_request = await fetch("https://lstnr.gq/.netlify/functions/get_show_info?showid="+url_params.get("AetBh69feedbH"));
      var show_info = await data_request.json()
      script_to_inject = `<meta name="description" content="${show_info.description}">
    <meta name="image" content="i${show_info.image}">
    <meta itemprop="name" content="${show_info.title} - listenr">
    <meta itemprop="description" content="${show_info.description}">
    <meta itemprop="image" content="${show_info.image}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${show_info.title} - listenr">
    <meta name="twitter:description" content="${show_info.description}">
    <meta name="twitter:image:src" content="${show_info.image}">
    <meta name="og:title" content="${show_info.title} - listenr">
    <meta name="og:description" content="${show_info.description}">
    <meta name="og:image" content="${show_info.image}">
    <meta name="og:url" content="https://listenr.gq/">
    <meta name="og:site_name" content="${show_info.title} - listenr">`;
      
      textReplacementRules = {
        "<title>listenr</title>": `<title>${show_info.title} - listenr</title>`
      };
    }
    scriptInjectionRules[script_to_inject] = 0;
    html = replaceText(html);
    html = injectScripts(html);

    // return modified response
    return new Response(html, {
        headers: response.headers
    })
}

function replaceText(html) {
    if (!textReplacementRules || textReplacementRules.length === 0) {
        return html;
    }

    var regexModifiers = 'g';
    if (textReplacement_caseInsensitive) {
        regexModifiers += 'i';
    }

    for (let k in textReplacementRules) {
        var v = textReplacementRules[k];

        if (textReplacement_useRegex) {
            html = html.replace(new RegExp(k, regexModifiers), v);
        }
        else {
            html = html.split(new RegExp(k, regexModifiers)).join(v);
        }
    }

    return html;
}

function injectScripts(html) {
    if (!scriptInjectionRules || scriptInjectionRules.length === 0) {
        return html;
    }

    var regexModifiers = 'gi';

    for (let k in scriptInjectionRules) {
        var v = scriptInjectionRules[k];

        switch (v) {
            case 0:
            default:
                var i = html.getInjectionIndex(new RegExp("<head>|<head [^>]*?>", regexModifiers));
                html = html.insertAt(i, k);
                break;
            case 1:
                var i = html.getInjectionIndex(new RegExp("</head>", regexModifiers));
                html = html.insertAt(i, k);
                break;
            case 2:
                var i = html.getInjectionIndex(new RegExp("<body>|<body [^>]*?>", regexModifiers));
                html = html.insertAt(i, k);
                break;
            case 3:
                var i = html.getInjectionIndex(new RegExp("</body>", regexModifiers));
                html = html.insertAt(i, k);
                break;
        }
    }

    return html;
}

String.prototype.getInjectionIndex = function (regex) {
    var match = this.match(regex);
    return match
        ? this.lastIndexOf(match[match.length - 1]) + match[match.length - 1].length
        : -1;
}

String.prototype.insertAt = function (index, string) {
    return this.substr(0, index) + string + this.substr(index);
}
