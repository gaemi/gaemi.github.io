---
layout: post
comments: true
title:  "RxJava with Android - 2 - RxJava 로 Android 비동기처리"
categories: android
tags: [android, 안드로이드, rxjava, rxandorid, 비동기처리]
---

## 시작에 앞서

이 포스팅은 RxJava 를 사용하여 Android 개발을 하는 방법을 소개하고 있습니다.
이 장을 이해하시는데 어려움이 있으시다면, 아래 링크된 전 장들을 읽고 오시는걸 추천드립니다.

- [RxJava with Android - 0 - 시작에 앞서](/android/2015/05/20/RxJava%20with%20Android%20-%201%20-%20RxJava%20사용해보기.html) 
- [RxJava with Android - 1 - RxJava 사용해보기](/android/2015/05/20/RxJava%20with%20Android%20-%201%20-%20RxJava%20사용해보기.html)

### Android 의 Main Thread

이미 Android 개발 경험이 있으신분들은 아시겠지만, __Android 에서 UI 를 그리고 갱신하는 Thread 는 Main Thread 하나__입니다.
(흔히 UI Thread 라는 용어로도 많이 사용됩니다. Main Thread = UI Thread 라고 생각하시면 됩니다.)

Main Thread 에서 장시간동안 작업이 이뤄지고 있으면, 화면 갱신은 이뤄지지 않게되고 결국엔 ANR이 발생하게 됩니다. 따라서 UI 갱신 이외의 다른 작업들은 별도의 Thread 에서 처리를 담당하는것이 좋습니다.
특히 네트워크 요청이라던지 파일 입출력, DB작업등의 IO작업들은 필히 Background Thread 에서 이뤄지는것이 좋습니다. (허니컴 이후부터는 Main Thread 에서 Network 요청이 있으면 NetworkOnMainThreadException 발생되게 됩니다.)

Background Thread 연산이 완료된 내용을 UI 에 반영하기 위해서는, Main Thread 에 UI 갱신 요청을 할 필요가 있는데요. Android 에서는 Handler 를 통해서 이런 요청을 하게 됩니다.
즉 아래와 같은 순서로 처리됩니다.

1. Main Thread 에서 연산처리를 위한 Background Thread 생성 
2. Background Thread 에서 IO 및 연산
3. Background Thread 에서 Handler 를 통해 Main Thread 에 UI 갱신 요청 message 전달
4. Main Thread 에서 message queue 에서 message 를 순차적으로 꺼내와 처리 (UI 갱신)

### Android 의 Background Thread 사용 방법

Android 에서 __Background Thread 를 사용하려다보면 신경쓰이는 부분이 바로 Main Thread 에 message 를 전달하는 부분__입니다.
Handler 를 사용해서 처리하는것은 꽤나 복잡하고 번거로운 작업들이 많고, Android 에서 일찍부터 지원해주었던 AsyncTask 같은 경우에도 Background Thread 로 처리하기에 그다지 용이한 구조는 아닙니다. __(심지어는 단위테스트도 쉽지가 않았습니다!!!)__
그래서 네트워크 요청(Android 에서 Main Thread 에서 작업하지 못하게 강제하고 있는)등의 일부 IO 를 제외하고는 여전히 Main Thread 에서 연산들을 처리하게 하는 경우가 종종 있으며, 그렇게 개발된 앱들이 많은것으로 알고 있습니다. 하지만 이는 연산이 처리되는 동안 UI 갱신을 위한 모든 코드가 Block 된다는 이야기이므로 사용자 경험에 큰 마이너스 요소가 됩니다.

아래 이미지를 보면 상품정보를 IO Thread 를 통해 가져오고, 이를 Computation Thread 에서 필터링하여 Main Thread 를 통해 화면에 표시해줍니다.
이미지를 보시면 아시다시피 Main Thread 에서 클릭이벤트, 다이얼로그표시, 상품정보표시 등 UI 작업 이외엔 어떤 작업도 하고 있지 않습니다.
__RxJava 는 위와 같은 흐름의 작업도 매우 쉽게 개발가능하게 도와줍니다.__

![RxJava를 이용한 상품정보조회 흐름](https://raw.githubusercontent.com/gaemi/gaemi.github.io/master/img/RxJava를 이용한 상품정보조회 흐름.png)

