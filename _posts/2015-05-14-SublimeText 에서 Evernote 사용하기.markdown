---
layout: post
title:  "SublimeText 에서 Evernote 사용하기"
date:   2015-05-14 09:10:12
categories: jekyll
---

## Markdown ?

Markdown 이나 asciidoc 문법은 깔끔하고 구조화된 문서를 작성할 수 있는 좋은 수단이다.

Evernote에서 이런 문법들을 지원하면 참 좋을텐데 그렇지도 않고. 그렇다고 에디터가 파워풀하지도 않아서 이래저래 아쉬움이 많았는데.

SublimeText 에 Plugin 을 설치해서 Evernote 에 Markdown 문법을 사용해서 노트를 작성하는 방법을 찾게 되었다!! (SublimeText는 볼수록 참 쓸만한거 같다.)

이 페이지도 sublime-evernote 를 사용해서 작성하였다.

## 준비

### SublimeText 3 설치

[SublimeText 3](http://www.sublimetext.com/3) 를 설치하도록 한다. SublimeText 2 버전은 [2 버전용 Plugin](https://github.com/jamiesun/SublimeEvernote) 이 따로 존재하는데 사용방법이 조금 다르다. 여기서는 3 버전만을 설명하도록 하겠다.

### Package Control 설치

SublimeText 의 Plugin 설치를 도와주는 [PackageControl](https://packagecontrol.io/installation) 을 설치하도록 한다.

  - `Ctrl+`` 을 누른 후 콘솔창에 아래를 입력한면 된다. {% highlight bash %}
import urllib.request,os,hashlib; h = 'eb2297e1a458f27d836c04bb0cbaf282' \+ 'd0e7a3098092775ccb37ca9d6b2e4b7d'; pf = 'Package Control.sublime-package'; ipp = sublime.installed_packages_path(); urllib.request.install_opener( urllib.request.build_opener( urllib.request.ProxyHandler()) ); by = urllib.request.urlopen( 'http://packagecontrol.io/' \+ pf.replace(' ', '%20')).read(); dh = hashlib.sha256(by).hexdigest(); print('Error validating download (got %s instead of %s), please try manual install' % (dh, h)) if dh != h else open(os.path.join( ipp, pf), 'wb' ).write(by){% endhighlight %}

### sublime-evernote 플러그인 설치

  1. `Ctrl+Shift+p` (맥은 `Command+Shift+p`) 를 누르고 `PackageControl: Install Package` 을 입력한다.
  2. Evernote 를 선택한다.

### 설정

  1. [Evernote DeveloperToken 발급](https://www.evernote.com/api/DeveloperToken.action) 로 이동해서 토큰을 발급받는다. 토큰값과 NoteStore URL 을 적어둔다.
  2. `Preferences > Package Settings > Evernote > User` 로 이동한다. 
  3. 아래와 같이 입력하고 저장한다. {% highlight javascript linenos %}
{
  "noteStoreUrl": "https://www.evernote.com/shard/s19/notestore",
  "token": "발급받은토큰"
}{% endhighlight %}
  4. 그 외 유용한 설정들은 [여기](https://github.com/bordaigorl/sublime-evernote/wiki/Settings)서 찾아볼 수 있다.

## 사용방법

  1. `Ctrl+Shift+p` (맥은 `Command+Shift+p`) 를 누르고 `Evernote:` 를 누르면 명령어들이 나온다.
  2. `New empty note` 는 새로운 노트를 생성해준다.
  3. `Open evernote note` 는 이미 작성되어 있는 노트를 불러올 수 있다. 
  노트를 수정하고 저장하면 자동으로 Evernote 로 전송해준다.
  4. `Send to EverNote as new note` 는 현재 작성한 문서를 Evernote 에 새로운 노트로 생성해준다.
  이 경우엔 문서를 수정하고 저장해도 자동으로 Evernote 로 전송해주지 않는 것 같다.

## Markdown 작성법

  - 개인적으로는 [GitHub Flavored Markdown](https://help.github.com/articles/github-flavored-markdown) 나 [Markdown help](http://stackoverflow.com/editing-help) 가 유용했다.
  - sublime-evernote wiki의 [Supported Markdown](https://github.com/bordaigorl/sublime-evernote/wiki/Supported-Markdown) 도 확인해보기 바란다.
  - 첨부파일도 넣을 수 있다. `Evernote:` 를 살펴보자.
  - 생각했던것만큼 이쁘게 나오지를 않는다면 [Style 을 수정](https://github.com/bordaigorl/sublime-evernote/wiki/Styling) 하는것도 괜찮은 방법이다.


## 업급했던 링크들

  * [PackageControl](https://packagecontrol.io/installation)
  * [SublimeEvernote 2](https://github.com/jamiesun/SublimeEvernote)
  * [SublimeEvernote 3](https://github.com/bordaigorl/sublime-evernote)
  * [Supported Markdown](https://github.com/bordaigorl/sublime-evernote/wiki/Supported-Markdown)
  * [GitHub Flavored Markdown](https://help.github.com/articles/github-flavored-markdown)
  * [Stackoverflow Markdown help](http://stackoverflow.com/editing-help)



