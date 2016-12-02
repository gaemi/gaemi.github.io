---
layout: post
comments: true
title:  "간단한 비동기 작업 처리를 위한 RxJava"
categories: rxjava
tags: [rxjava, async]
---

특정한 작업들에 대한 처리 흐름이 정의된것을 RxJava 에서는 (주로) Observable 이라고 표현한다.
일반적으로 사용되는 Observable 은 Cold Observable 이라고 하며, 하나의 subscriber 가 subscribe 할때마다 하나의 처리 흐름이 생긴다.
Observable 은 0..N 개의 Item 을 발행하며 (`onNext(item)`) 최종적으로 `onCompleted()` 를 전파하여 흐름이 종료되었음을 알린다.
그리고 중간에 예외적인 상황이 발생한 경우 `onError(throwable)` 을 전파하고 흐름을 종료한다.

Observable 은 RxJava 세계에서 생산자에 속하며 매우 중요한 요소이다.
또 RxJava 를 사용하면서 가장 중요한 것 중 하나는 **Observable, 즉 작업에 대한 처리 흐름을 얼마만큼 잘 정의하느냐**가 아닐까 생각한다.

여기서는 **RxJava 를 사용하여 간단한 비동기 작업 처리 흐름을 만드는 방법**에 대해서 설명하고자 한다.

## Creating Observables

### Observable.create()

아래는 `Observable.create()`  를 사용하여 “Hello” “My name is” “Gaemi” 라는 문자열이 발행되는 observable 을 생성하는 코드이다.

```
Observable.create(
  subscriber -> {
    subscriber.onNext("Hello");
    subscriber.onNext("My name is");
    subscriber.onNext("Gaemi");
    subscriber.onCompleted();
  });
```

언뜻본다면 큰 문제는 없어 보인다.
물론 `Observable.from()` 를 사용한다면 `subscriber.onComplete()` 와 같은 코드를 신경쓰지 않고 더 편하게 사용이 가능하다.

```
Observable.from(Arrays.asList("Hello", "My name is", "Gaemi”));
```

하지만 `Observable.just()` 나 `Observable.from()` 와 같은 경우 발행되는 Item 들이 observable 생성시점에 이미 정해져있어야 한다. 
즉 Database 상에서 데이터를 읽어 오는 작업과 같이 비용이 큰 작업들을 비동기로 처리하고자 할 때에는 적절하지 않다.

아래와 같은 도서정보 가져오기위한 DAO 가 있다고 가정해보자.

```
public interface BookDao {
	List<Book> findAll();
}
```

전체 도서정보를 비동기로 가져와서 사용하기 위해서 아래와 같은 코드를 만들 수 있다.

```
Observable.create(
  subscriber -> {
    List<Book> books = dao.findAll();
    subscriber.onNext(books);
    subscriber.onCompleted();

  })
  .subscribeOn(Scheduler.io())
  .subscribe(books -> {
    // Next Step
  });
```

언뜻 보아도 문제가 많아 보인다.
우선은 `dao.findAll()` 작업에서 발생할 수 있는 예외상황들이 전파되고 있지 않고 있다.

```
Observable.create(
  subscriber -> {
    try {
      List<Book> books = dao.findAll();
      subscriber.onNext(books);
      subscriber.onCompleted();
    } catch (Exception e) {
      subscriber.onError(e);
    }
  })
  .subscribeOn(Schedulers.io())
  .subscribe(books -> {
    // Next Step
  }, throwable -> {
    // Error handling
  });
```

한결 나아졌다.
하지만 한가지 더 문제가 있는데 `dao.findAll()` 은 비용이 큰 작업이며 이 작업이 완료된 시점에 여전히 subscriber 가 구독상태로 존재한다는 보장은 없다는 것이다.
(외부 요인에 의하여 `unsubscribe()` 되었을 가능성이 있다. 그리고 이 경우에는 Item 이 발행되어서는 안된다.)

```
Observable.create(
  subscriber -> {
    try {
      List<Book> books = dao.findAll();
      if (!subscriber.isUnsubscribed()) {
        subscriber.onNext(books);
        subscriber.onCompleted();
      }
    } catch (Exception e) {
      if (!subscriber.isUnsubscribed()) {
        subscriber.onError(e);
      }
    }
  })
  .subscribeOn(Schedulers.io())
  .subscribe(books -> {
    // Next Step
  }, throwable -> {
    // Error handling
  });
``` 

다른 문제들이 있을지는 제쳐두고라도, 우선 당장 `Observable.create()` 를 사용하기 위해서는 최소 이정도의 코드는 작성해야한다.
간단한 비동기 작업이라고 해도 말이다.

### Observable.defer()

이처럼 `Observable.create()` 만으로는 간단한 비동기 처리 흐름을 만들기는 어려운 작업이며 실수할 여지가 매우 많다.
그래서 많은 개발자들은 `Observable.create()` 대신 `Observable.defer()` 를 사용하는걸 추천한다.

```
Observable.defer(() -> {
    List<Book> books = dao.findAll();
    return Observable.just(books);
  })
  .subscribeOn(Schedulers.io())
  .subscribe(books -> {
    // Next Step
  }, throwable -> {
    // Error handling
  });
```

`Observable.defer()` 비동기로 observable 을 생성하고 하위 스트림에서 사용할 수 있도록 해준다.
여기서는 `dao.findAll()` 을 통해 반환된 결과를 `Observable.just()` 를 사용하여 새로운 작업흐름을 만들고 반환하였다.
observable 을 만들기 위한 observable 이 필요하다는 점에서 추가되는 비용이 있지만 `Observable.create()` 보다는 훨씬 간결한 코드가 만들어졌다.
명시적으로 `onComplete()` 나 `onError()` 를 처리해줄 필요가 없으며, subscriber 의 구독상태를 확인할 필요도 없다.

### Observable.fromCallable()

RxJava 1.2 부터는 위와 같이 비동기로 작업을 처리하고 그 결과 (하나의 Item) 가 발행되는 작업흐름을 보다 편리하게 만들기 위해 `Observable.fromCallable()` 이 추가되었다.

```
Observable.fromCallable(dao::findAll)
  .subscribeOn(Schedulers.io())
  .subscribe(books -> {
    // Next Step
  }, throwable -> {
    // Error handling
  });
```

중복으로 observable 을 생성하지 않는다는 점에서 `Observable.defer()` 보다 나은 형태라고 보여진다.

# Single, Completable

Observable 은 0..N 개의 Item 을 전파할 수 있는 작업 흐름이다.
RxJava 1.1 부터는 작업이 종료됨과 동시에 1개의 Item 만을 전파하는 Single. 발행하는 Item 은 없이 작업의 종료만을 전파하는 Completable 이 추가되었다.
(복잡하지 않은) 대부분의 비동기 작업들은 Observable 보다는 Single 이나 Completable 이 더 어울린다.

###  Single

Single 은 Observable 과는 다르게 `onSuccess(item)` 과 `onError(throwable)`만을 가진다.
비동기 처리 후 결과만을 반환해야 하는 경우, 즉 위와 같이 dao 등을 통해 데이터를 비동기로 불러오고자 하는 경우에 적절하다.
```
Single.fromCallable(dao::findAll)
  .subscribeOn(Schedulers.io())
  .subscribe(books -> {
    // Next Step
  }, throwable -> {
    // Error handling
  });
```

### Completable

Completable 은 `onCompleted()` 와 `onError(throwable)` 만을 가진다.
비동기 처리 후 반환되는 결과가 없는 경우 사용하면 된다.

```
Completable.fromAction(heavyJob::run)
  .subscribeOn(Schedulers.io())
  .subscribe(() -> {
    // Next Step
  }, throwable -> {
    // Error handling
  });
```

### Maybe

RxJava 2.0 에서는 Maybe 가 추가되었다.
Maybe 는 `onSuccess(item)` `onComplete()` 중 하나가 전파되는 작업흐름이다. (물론 예외가 발생한다면 `onError(throwable)` 가 전파될 수 있다.)
RxJava 2.0 에서는 null 을 전파할 수 없다.
Maybe 를 사용한다면 Optional 을 사용하지 않고도 0 또는 1 개의 item 을 전파하는 작업흐름을 만들 수 있다.

## 마치며

RxJava 에서는 처리 흐름을 만들기 위한 다양한 요소들을 제공하고 있다.
또 RxJava 는 계속 발전하고 있고 여기 나온 방법보다 더 간결하고 우아한 형태로 처리 흐름을 정의할 수도 있을것이다.

하지만 상당수의 개발자들은 이런 RxJava 의 다양한 기능에 어떤 방법으로 처리 흐름을 만드는 게 좋을지 오히려 혼란스러울 때가 많을 거라 생각한다.

나의 경험치 안에서 편리하고 자주 사용되었던 방법을 정리하였으나, RxJava 를 이제 막 시작하는 개발자들에게 조금이라도 도움이 되기를 바란다.

## 참고

* [Creating Observables · ReactiveX/RxJava Wiki · GitHub](https://github.com/ReactiveX/RxJava/wiki/Creating-Observables)
* [ReactiveX - From operator](http://reactivex.io/documentation/operators/from.html)
* [ReactiveX - Single](http://reactivex.io/documentation/single.html)
* [Advanced Reactive Java: The new Completable API (part 1)](http://akarnokd.blogspot.kr/2015/12/the-new-completable-api-part-1.html)
* [What’s different in 2.0 · ReactiveX/RxJava Wiki · GitHub](https://github.com/ReactiveX/RxJava/wiki/What's-different-in-2.0)

