---
layout: post
comments: true
title:  "RxJava with Android - 1 - RxJava 사용해보기"
categories: android
tags: [android, 안드로이드, rxjava, rxandorid, 비동기처리]
---

## 시작에 앞서

### ReactiveX 란?

RxJava 를 사용하기 전에 Reactive Extensions (ReactiveX 라고 부르도록 하겠습니다) 에 대해서 살짝 언급을 해볼까 합니다.
ReactiveX 는 C# 에 먼저 등장을 하였으며, [비동기처리와 이벤트기반의 프로그램 개발을 위해 유용한 기능들을 제공](https://msdn.microsoft.com/en-us/data/gg577609.aspx)하여 줍니다. [ReactiveX](http://reactivex.io) 를 방문하면 아래와 같은 문구를 발견할 수 있는데, ReactiveX 의 특징을 잘 설명하고 있다고 생각합니다.
> __The Observer pattern done right__
ReactiveX is a combination of the best ideas from
the Observer pattern, the Iterator pattern, and functional programming

앞으로 __ReactiveX 는 Observer패턴과 Iterator패턴, 그리고 함수형프로그래밍의 아이디어를 조합한 형태__라고 이해를 하시면 편할겁니다. 다른방향에서 생각한다면 ReactiveX를 제대로 활용하려면 __Observer패턴, Iterator패턴을 잘 이해__하고 있어야 합니다. 더불어 __함수형프로그래밍에 대한 이해__도 있다면 더 좋습니다.

__RxJava 는 이런 ReactiveX 를 Java 에서 사용할 수 있도록 개발된 라이브러리__입니다. ReactiveX 는 C#, Java 외에도 Scala, Javascript, Python 등 [다양한 언어에서 사용가능하도록 포팅](http://reactivex.io/languages.html)되어 있습니다.

### Observer 패턴

위에서 RxJava를 사용하려면 Observer패턴에 대한 이해가 필요하다고 언급하였습니다.
위키백과의 [옵서버패턴](http://ko.wikipedia.org/wiki/%EC%98%B5%EC%84%9C%EB%B2%84_%ED%8C%A8%ED%84%B4)을 보면 잘 설명이 되어 있습니다.
> 옵서버 패턴(observer pattern)은 객체의 상태 변화를 관찰하는 관찰자들, 즉 옵저버들의 목록을 객체에 등록하여 상태 변화가 있을 때마다 메서드 등을 통해 객체가 직접 목록의 각 옵저버에게 통지하도록 하는 디자인 패턴이다. 주로 분산 이벤트 핸들링 시스템을 구현하는 데 사용된다. 발행/구독 모델로 알려져 있기도 하다.

![위키백과 옵서버패턴 UML다이어그램](http://upload.wikimedia.org/wikipedia/commons/8/8d/Observer.svg "Observer")

위 그림에서 __Subject 는 이벤트를 발생시키는 주체__입니다. RxJava 에서는 __Observable(또는 Subject)__라는 이름으로 표현이 됩니다. Subject 에서 발생되는 이벤트들은 그 Subject 에 관심있다고 등록한 __Observer 들에게 전달__됩니다. 여기서 Observer 는 RxJava 에서는 __Subscriber__ 라는 이름으로 표현이 됩니다.

나중에 언급하겠지만 때에 따라서 Observable 도 Subscriber 의 역할을 할 수 있습니다. 
하지만 우선은 아래와 같이 이해하시는걸로 충분하겠습니다.

- __Observable__ : 이벤트를 발생시킨다.
- __Subscriber__ : 발생된 이벤트를 받아 처리한다.

RxJava 의 Observable 는 Observer 패턴과 유사하지만, 조금 다른 부분이 있는데요.
바로 누군가 구독(subscribe)하고 있지 않는다고 하면 이벤트를 발생시키지 않습니다. (이 부분은 RxJava를 계속 사용하다보면 감이 잡힐겁니다. 그리고 매우 중요한 개념입니다.)

Observer 패턴은 RxJava 를 사용하기전에 꼭 알아두어야 하는 패턴이니 꼭 이해하셔야 합니다.

## RxAndroid gradle 셋팅

build.gradle 의존성항목에 [RxAndroid](https://github.com/ReactiveX/RxAndroid) 를 추가합니다. RxAndroid 가 [RxJava](https://github.com/ReactiveX/RxJava) 에 대해 의존성을 가지고 있기 때문에 따로 RxJava 를 추가할 필요는 없습니다.
RxAndroid 는 Android 환경에서 RxJava 를 사용하기 위한 여러가지 편리한 도구들을 지원해 줍니다.

```groovy
dependencies {
    ...
    compile 'io.reactivex:rxandroid:0.24.0'
}
```

이번장에서는 RxJava 에 대한 내용을 주로 설명할 예정이므로, RxAndroid 를 사용하지는 않습니다.
일반 Java 프로젝트에서 예제를 따라해보기를 원하시면 RxAndroid 대신에 RxJava 만 추가하셔서 진행하셔도 됩니다.

```groovy
dependencies {
    ...
    compile 'io.reactivex:rxjava:1.0.11'
}
```

## RxJava 접해보기

### Observable 과 Subscriber 사용해보기

Observer 패턴을 설명하면서 언급했듯이 __Observable 은 이벤트를 발생시키는 주체__입니다.
Observable 은 이벤트를 하나만 발생시킬 수 있고 여러번 발생시킬수도 있습니다. (심지어는 하나도 발생하지 않을수도 있습니다.)
또 최종적으로 이벤트의 종료를 알리거나 에러가 발생하였음을 알리게 됩니다.

RxJava 에서 이벤트의 발생, 종료, 에러는 아래와 같이 표현이 됩니다.

- __onNext__ : 이벤트의 발생
- __onCompleted__ : 이벤트 종료
- __onError__ : 에러가 발생

Subscriber 입장에서는 Observable 로 부터 아래와 같이 전파를 받게 됩니다.
> onNext(*), onCompleted(1) or onError(1)

쉽게 이해가 안가시나요? 코드를 보면서 확인해보도록 하겠습니다.

```java
    @Test
    public void just_테스트() {
        System.out.println("create observable");
        Observable<String> observable = Observable.just("개미");
        System.out.println("do subscribe");
        observable.subscribe(new Subscriber<String>() {
            @Override public void onNext(String text) {
                System.out.println("onNext : " + text);
            }

            @Override public void onCompleted() {
                System.out.println("onCompleted");
            }

            @Override public void onError(Throwable e) {
                System.out.println("onError : " + e.getMessage());
            }
        });
    }

    // 결과
    create observable
    do subscribe
    onNext : 개미
    onCompleted
```

`Observable.just()` 는 누군가가 구독(subscribe)을 하게 되면 "개미" 라는 이벤트를 1번 발생시키는 Observable 이라고 이해하시면 됩니다.
따라서 subscribe onNext 로 "개미" 가 전달된 후 onCompleted 가 호출된것을 확인하실 수 있습니다. 

```java
    @Test
    public void from_테스트() {
        System.out.println("create observable");
        Observable<String> observable = Observable.from(new String[] { "개미", "매", "마루" });
        System.out.println("do subscribe");
        observable.subscribe(new Subscriber<String>() {
            @Override public void onNext(String text) {
                System.out.println("onNext : " + text);
            }

            @Override public void onCompleted() {
                System.out.println("onCompleted");
            }

            @Override public void onError(Throwable e) {
                System.out.println("onError : " + e.getMessage());
            }
        });
    }

    // 결과
    create observable
    do subscribe
    onNext : 개미
    onNext : 매
    onNext : 마루
    onCompleted
```

`Observable.from()` 은 배열 또는 Iterable 의 요소를 순서대로 이벤트로 발생시키는 Observable 이라고 이해하시면 됩니다. 즉 "개미", "매", "마루" 순서로 이벤트가 발생이 되겠네요.
따라서 onNext 로 "개미", "매", "마루" 가 순서대로 호출되고 최종적으로 onCompleted 가 호출되었습니다.

```java
    @Test
    public void defer_테스트() {
        System.out.println("create observable");
        Observable<String> observable = Observable.defer(new Func0<Observable<String>>() {
            @Override public Observable<String> call() {
                System.out.println("defer function call");
                return Observable.just("HelloWorld");
            }
        });
        System.out.println("do subscribe");
        observable.subscribe(new Subscriber<String>() {
            @Override public void onNext(String text) {
                System.out.println("onNext : " + text);
            }

            @Override public void onCompleted() {
                System.out.println("onCompleted");
            }

            @Override public void onError(Throwable e) {
                System.out.println("onError : " + e.getMessage());
            }
        });
    }

    // 결과
    create observable
    do subscribe
    defer function call
    onNext : HelloWorld
    onCompleted
```

`Observable.defer()` 는 구독(subscribe) 하는 순간 특정 function 을 실행하고 리턴받은 Observable 의 이벤트를 전달합니다.
결과 순서를 잘 보시면 __do subscribe__ 이후에 __defer function call__ 이 호출되었음을 보실 수 있습니다.
그리고 function 에서 리턴한 __Observable.just()__ 의 이벤트가 그대로 Subscriber 에게 전달되었음을 보실 수 있습니다.

### 비동기처리를 위한 subscribeOn 과 observeOn

`Observable.defer()` 와 subscribeOn, observeOn 를 사용하면 쉽게 비동기 처리를 하실수 있습니다. 

```java
    @Test
    public void defer_비동기_테스트() {
        System.out.println(Thread.currentThread().getName() + ", create observable");
        Observable<String> observable = Observable.defer(new Func0<Observable<String>>() {
            @Override public Observable<String> call() {
                System.out.println(Thread.currentThread().getName() + ", defer function call");
                return Observable.just("HelloWorld");
            }
        });
        System.out.println(Thread.currentThread().getName() + ", do subscribe");
        observable
            .subscribeOn(Schedulers.computation()) // computation thread 에서 defer function 이 실행됩니다.
            .observeOn(Schedulers.newThread()) // 새로운 thread 에서 Subscriber 로 이벤트가 전달됩니다.
            .subscribe(new Subscriber<String>() {
                @Override public void onNext(String text) {
                    System.out.println(Thread.currentThread().getName() + ", onNext : " + text);
                }

                @Override public void onCompleted() {
                    System.out.println(Thread.currentThread().getName() + ", onCompleted");
                }

                @Override public void onError(Throwable e) {
                    System.out.println(Thread.currentThread().getName() + ", onError : " + e.getMessage());
                }
            });

        System.out.println(Thread.currentThread().getName() + ", after subscribe");
    }

    // 결과
    main, create observable
    main, do subscribe
    main, after subscribe
    RxComputationThreadPool-3, defer function call
    RxNewThreadScheduler-1, onNext : HelloWorld
    RxNewThreadScheduler-1, onCompleted
```

보시면 main thread 에서 Observable 을 생성하고 Subscriber 를 등록하는 작업들을 진행하고 있습니다.
하지만 defer 내부 function 은 RxComputationThreadPool 의 thread 에서 실행이 되고 있구요. 발생된 이벤트가 Subscriber 에는 RxNewThreadScheduler 라는 thread 에서 전달되고 있습니다.

자! 눈치 빠르신 분들은 `subscribeOn()` 과 `observeOn()` 의 역할에 대해서 눈치를 채셨을거라 생각합니다.
`subscribeOn()` 은 __defer() 에서 사용되는 function 실행되는 thread__, `observeOn()` 은 __Subscriber 에서 사용되는 thread__ 를 지정하였구나! 라고 말이죠.
그렇게 이해하셔도 틀린것은 아닙니다만 정확한 이해는 아닙니다.

`subscribeOn()` 는 누군가 Observable 에 관심이 있다고 등록할때. __구독(subscribe)이 이루어지는 thread 를 지정__합니다.
앞에서 defer()는 구독했을때 function 이 실행이 된다고 이야기하였습니다. 즉 구독이 RxComputationThreadPool 에서 이루어지면서 function 이 RxComputationThreadPool 에서 실행이 되게 되는 것입니다.

`observeOn()` Observable 이 __구독하고 있는 대상들에게 이벤트를 전파할때 사용되는 thread 를 지정__합니다.
흔히 구독을 하는건 Subscriber 이기 때문에 Subscriber 가 동작하는 thread 를 지정하겠구나 라고 생각할 수 있지만, Observable 의 이벤트에 관심있어하는건 Subscriber 가 아닌 다른 누군가일수도 있습니다.
아래 코드를 보시면 좀 더 이해가 쉬우실겁니다.

```java
    @Test
    public void defer_비동기_테스트_2() {
        System.out.println(Thread.currentThread().getName() + ", create observable");
        Observable<String> observable = Observable.defer(new Func0<Observable<String>>() {
            @Override public Observable<String> call() {
                System.out.println(Thread.currentThread().getName() + ", defer function call");
                return Observable.just("HelloWorld");
            }
        });
        System.out.println(Thread.currentThread().getName() + ", do subscribe");

        Observable<String> observable2 = observable
            .subscribeOn(Schedulers.computation())
            .observeOn(Schedulers.newThread())
            .map(new Func1<String, String>() {
                @Override public String call(String text) {
                    System.out.println(Thread.currentThread().getName() + ", map");
                    return "(" + text + ")";
                }
            });

        observable2
            .observeOn(Schedulers.newThread())
            .subscribe(new Subscriber<String>() {
                @Override public void onNext(String text) {
                    System.out.println(Thread.currentThread().getName() + ", onNext : " + text);
                }

                @Override public void onCompleted() {
                    System.out.println(Thread.currentThread().getName() + ", onCompleted");
                }

                @Override public void onError(Throwable e) {
                    System.out.println(Thread.currentThread().getName() + ", onError : " + e.getMessage());
                }
            });

        System.out.println(Thread.currentThread().getName() + ", after subscribe");
    }

    // 결과
    main, create observable
    main, do subscribe
    main, after subscribe
    RxComputationThreadPool-3, defer function call
    RxNewThreadScheduler-2, map
    RxNewThreadScheduler-1, onNext : (HelloWorld)
    RxNewThreadScheduler-1, onCompleted
```

점점 코드가 복잡해져가는군요 ㅠㅠ
뒤에 나올 Java8 의 Lambda 를 적용하면 훨씬 간결해집니다. 우선은 복잡하더라도 양해 부탁드립니다.

map() 은 함수형 언어를 접해보신 분들은 익숙하실겁니다. "HelloWorld" 를 받아서 괄호로 쌓여진 결과를 리턴하지요.
위 코드에서는 observable > observable2 > subscriber 로 이벤트가 전파가 됩니다. 즉 observable 의 이벤트를 구독하고 있는 녀석은 subscriber 가 아니라 observable2 가 되게 됩니다.
그러니 observable.observeOn() 에서 지정한 스레드는 observable 에서 observable2 로 이벤트를 전파할때 사용하는 스레드가 됩니다. 그리고 observable2.observeOn() 에서 지정한 스레드는 subscriber 로 전파될때 사용되는 스레드입니다.

__RxJava 에서는 observeOn() 을 지정하지 않으면 현재 스레드에서 계속 이벤트가 전파되게 되며, observeOn() 을 지정하게 되면 지정한 스레드로 갈아타서 이벤트를 전파하게 됩니다.__
즉 observable2.observeOn() 를 지정하지 않았다면 observable.observeOn() 에 지정된 스레드를 통해 subscriber 까지 이벤트가 전파되게 됩니다.

subscribeOn 과 observeOn 는 그 개념이 잘 와닿지도 않고 많이 어렵게 느껴지실수도 있습니다.
하지만! __Android 에서 RxJava 를 잘 사용하기 위해 반드시 필요한 요소이니 꼭! 숙지__하셔야 합니다.

### With Lambda

지금까지 코드를 보면 많은 익명클래스들이 사용되면서 가독성이 별로 좋지 않다는것을 느끼실 수 있을겁니다.
다행히 Java8에서는 Lambda 를 지원하여서 익명함수들을 좀 더 깔끕하게 표현할 수 있는 방법을 제공해줍니다.
Android 에서는 Java8 을 지원하고 있지는 않지만, retrolambda 와 같은 플러그인을 사용하여 Lambda 를 사용할 수 있는데요. retrolambda 를 사용하는 방법은 다음장에 설명하도록 하겠습니다.
우선은 Lambda 를 사용하면 아래와 같이 훨씬 간결한 표현이 가능하다는 걸 알아두시기 바랍니다. 또 이후로 설명은 Lambda 를 사용한 코드로 설명을 하도록 하겠습니다.

```java
    @Test
    public void just_테스트_lambda() {
        System.out.println("create observable");
        Observable<String> observable = Observable.just("개미");
        System.out.println("do subscribe");
        observable.subscribe(
            text -> System.out.println("onNext : " + text),
            e -> System.out.println("onError : " + e.getMessage()),
            () -> System.out.println("onCompleted")
        );
    }
``` 

### Observable 만들기

그렇다면 Observable 은 어떻게 생성할 수 있을까요?
RxJava 에는 Observable 을 만들 수 있는 [다양한 방법](http://reactivex.io/documentation/observable.html)들이 제공되고 있습니다.
단순히 비동기처리를 위해서만 RxJava 를 사용한다면 Observable 를 만드는 방법에 대해 많이 보실 필요는 없습니다.
하지만 한번쯤은 [사이트](http://reactivex.io/documentation/observable.html)에 방문하셔서 여러 Observable 에 대한 설명과 그림을 보시는걸 추천드립니다.
여기서는 앞에서 언급했던 just(), from(), defer() 이외에 종종 사용하게되는 몇가지만 더 언급하고 넘어가도록 하겠습니다.

#### interval()

![interval()](http://reactivex.io/documentation/operators/images/interval.c.png)

[interval()](http://reactivex.io/documentation/operators/interval.html)은 주기적으로 이벤트를 전파해줍니다. (전파되는 이벤트는 0,1,2 .... 와 같습니다)
타임워치나 특정 주기마다 같은 일을 반족해야 할 필요성이 있을 때 주로 사용할 수 있습니다.

```java
    @Test
    public void interval() {
        Observable.interval(1, TimeUnit.SECONDS)
            .observeOn(Schedulers.computation())
            .subscribe(count -> {
                System.out.println("onNext : " + new Date());
            });

        ...
    }

    // 결과
    onNext : Wed May 20 20:47:47 KST 2015
    onNext : Wed May 20 20:47:48 KST 2015
    onNext : Wed May 20 20:47:49 KST 2015
    onNext : Wed May 20 20:47:50 KST 2015
    onNext : Wed May 20 20:47:51 KST 2015
    onNext : Wed May 20 20:47:52 KST 2015
    ...
```

#### timer()

![timer()](http://reactivex.io/documentation/operators/images/timer.c.png)

[timer()](http://reactivex.io/documentation/operators/timer.html) 는 특정시간만큼 지나서 이벤트를 발생시킵니다. (전파되는 이벤트는 0 입니다)

```java
    @Test
    public void timer() {
        System.out.println("start : " + new Date());
        Observable.timer(10, TimeUnit.SECONDS)
            .observeOn(Schedulers.computation())
            .subscribe(
                count -> System.out.println("onNext : " + new Date()),
                e -> System.out.println("onError : " + new Date()),
                () -> System.out.println("onCompleted : " + new Date())
            );
        ...
    }

    // 결과
    start : Wed May 20 21:01:41 KST 2015
    onNext : Wed May 20 21:01:51 KST 2015
    onCompleted : Wed May 20 21:01:51 KST 2015
```

#### range()

![range()](http://reactivex.io/documentation/operators/images/range.c.png)

[range()](http://reactivex.io/documentation/operators/range.html) 는 시작점과 반복횟수를 지정하면 n, n+1, n+2, .. 와 같이 반복하여 이벤트를 발생시킵니다.
특정횟수만큼 반복하고 싶은게 있으면 range() 를 사용하시면 되겠습니다.

```java
    @Test
    public void range() {
        Observable.range(10, 10)
            .observeOn(Schedulers.computation())
            .subscribe(
                count -> System.out.println("onNext : " + count),
                e -> System.out.println("onError"),
                () -> System.out.println("onCompleted")
            );
        ...
    }

    // 결과
    onNext : 10
    onNext : 11
    onNext : 12
    onNext : 13
    onNext : 14
    onNext : 15
    onNext : 16
    onNext : 17
    onNext : 18
    onNext : 19
    onCompleted
``` 

### Observable 변형하기

발생되는 이벤트를 [다른 형태로 변형](http://reactivex.io/documentation/operators.html#transforming)하기를 원하실수도 있습니다.
가장 많이 사용되는건 map 과 flatMap 입니다. 둘 다 함수형 언어에서 자주 나오는 개념들이니 친숙하신 분들도 계실겁니다. 굉장히 자주 사용하게 되니 꼭 ! 기억하시기 바랍니다.

#### map()

[map()](http://reactivex.io/documentation/operators/map.html)은 함수를 사용하여 전달받은 이벤트를 다른값으로 변경합니다.

```java
    @Test
    public void map() {
        Observable.from(new String[] { "개미", "매", "마루" })
            .map(text -> "** " + text + " **")
            .subscribe(
                text -> System.out.println("onNext : " + text),
                e -> System.out.println("onError"),
                () -> System.out.println("onCompleted"));
    }

    // 결과
    onNext : ** 개미 **
    onNext : ** 매 **
    onNext : ** 마루 **
    onCompleted
```

#### flatMap()

![flatMap()](http://reactivex.io/documentation/operators/images/flatMap.c.png)

[flatMap()](http://reactivex.io/documentation/operators/flatmap.html)은 전달받은 이벤트로부터 다른 Observable 들을 생성하고, 그 Observable 들에서 발생한 이벤트들을 쭉 펼쳐서 전파합니다.
조금 헷갈리시는 분들은 위 그림과 아래 코드를 보시면 좀 더 쉽게 이해가 되실겁니다.

```java
    @Test
    public void flatMap() {
        Observable.from(new String[] { "개미", "매", "마루" })
            .flatMap(
                text -> Observable.from(new String[] { text + " 사랑합니다.", text + " 고맙습니다." })
            )
            .subscribe(
                text -> System.out.println("onNext : " + text),
                e -> System.out.println("onError"),
                () -> System.out.println("onCompleted"));
    }

    // 결과
    onNext : 개미 사랑합니다.
    onNext : 개미 고맙습니다.
    onNext : 매 사랑합니다.
    onNext : 매 고맙습니다.
    onNext : 마루 사랑합니다.
    onNext : 마루 고맙습니다.
    onCompleted
``` 

### Observable 합성하기

두개 이상의 Observable 을 합성해야 하는 경우도 있습니다.
나중에 data-flow 에 기반한 개발에서 매우 자주 언급되고 사용되기는 하지만, 일반적인 비동기작업에서는 자주 사용하는 개념은 아닙니다.
하지만 알고 있으면 종종 사용하게되는 유용한 도구들이니 한번쯤 살펴보고 넘어가시는걸 추천드립니다.

#### zip()

네트워크 작업으로 사용자의 프로필과 프로필 이미지를 동시에 요청하고, 그 결과를 합성해서 화면에 표현해준다거나 하는 형태의 작업이 필요한 경우 [zip()](http://reactivex.io/documentation/operators/zip.html) 유용하게 사용됩니다.

```java
    @Test
    public void zip() {
        Observable.zip(
            Observable.just("개미"),
            Observable.just("gaemi.jpg"),
            (profile, image) -> "프로필 : " + profile + ", 이미지 : " + image
        ).subscribe(
            print -> System.out.println("onNext : " + print),
            e -> System.out.println("onError"),
            () -> System.out.println("onCompleted")
        );
    }

    // 결과
    onNext : 프로필 : 개미, 이미지 : gaemi.jpg
    onCompleted
```

### Subject 사용하기

[Subject](http://reactivex.io/documentation/subject.html) 는 Observable + Subscriber 로 종종 표현되고는 합니다만, 정확한 표현은 아니라고 생각합니다. (왜냐하면 일반적인 Subscriber 처럼 subscribe()에 직접 사용되는 경우는 거의 없습니다.)
물론 Subject 는 Observable 과 Subscriber 를 모두 implementation 하고 있으니 틀린 이야기는 아닙니다만,
저는 __Subject 는 이벤트를 전달받아 구독자들에게 이벤트를 전파하는 중간다리__라고 하는게 좀 더 정확한 표현이라고 생각합니다.
onNext()로 전달받은 이벤트를 구독자들에게 전파하며, onCompleted()나 onError()를 받으면 이것 역시 구독자들에게 전파하고 Observable로의 역할을 종료하게 됩니다.
Android 에서는 EventBus 와 같은 형태로도 사용이 가능합니다. 즉 RxJava 를 사용하면 다른 EventBus 라이브러리가 불필요해집니다.

EventBus 언급을 한것에서 살짝 힌트를 받으셨겠지만 Subject 들은 보통 onCompleted 와 같이 종료하는 과정이 없이, 액티비티 라이프사이클(또는 앱 라이프사이클)과 동일하게 살아서 이벤트를 전파하는 역할로 자주 사용됩니다. 

여기서는 PublishSubject 와 BehaviorSubject 만 언급하고 넘어가겠습니다만, 다른 Subject 들도 무척 유용하니 기회가 된다면 한번씩 사용해보시는걸 권장해드립니다.

#### PublishSubject

![PublishSubject](http://reactivex.io/documentation/operators/images/S.PublishSubject.png)

PublishSubject 를 구독한 시점으로부터 이후에 발생하는 이벤트들을 전달받습니다.
자주 사용되는 Subject 입니다.

```java
    @Test
    public void publishSubject() {
        PublishSubject<String> subject = PublishSubject.create();

        subject.onNext("첫번째 호출");
        subject.onNext("두번째 호출");

        subject.subscribe(text -> {
            System.out.println("onNext : " + text);
        });

        subject.onNext("세번째 호출");
        subject.onNext("네번째 호출");
    }

    // 결과
    onNext : 세번째 호출
    onNext : 네번째 호출
```

#### BehaviorSubject

![BehaviorSubject](http://reactivex.io/documentation/operators/images/S.BehaviorSubject.png)

BehaviorSubject 는 PublishSubject 와 비슷합니다만, 구독전에 한건이라도 이벤트가 발생했다면 구독시점에 해당 이벤트도 같이 전달받습니다.

```java
    @Test
    public void behaviorSubject() {
        BehaviorSubject<String> subject = BehaviorSubject.create();

        subject.onNext("첫번째 호출");
        subject.onNext("두번째 호출");

        subject.subscribe(text -> {
            System.out.println("onNext : " + text);
        });

        subject.onNext("세번째 호출");
        subject.onNext("네번째 호출");
    }

    // 결과
    onNext : 두번째 호출
    onNext : 세번째 호출
    onNext : 네번째 호출
```  

## 마무리

지금까지 RxJava 에 대해서 간략하게 알아보았습니다.
저처럼 생소한 개념들에 이해하기가 어려운 분들도 있으실거고, 친숙하게 느껴지시는 분들(특히 함수형 프로그래밍을 접해보신 분들)도 있으실 겁니다.

RxJava 를 사용해보기로 마음을 먹으셨다면, 테스트프로젝트 하나를 띄워두시고 꼭 위에 있는 코드들을 한번씩 실행해보시고 넘어가시는걸 추천드립니다.

또 시간적 여유가 된다면 [RxJava Wiki](https://github.com/ReactiveX/RxJava/wiki) 를 보면서 RxJava 에 어떠한 도구들이 제공되고 있는지 확인해보시는것도 추천드립니다.

다음장에선 실제로 Android 에 RxJava 를 적용하는 방법을 알려드리도록 하겠습니다.


