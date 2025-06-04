
Опубликованные скрипты позволяют активировать некоторые фичи (и даже больше), которые доступны только в облаке diplodoc, но не доступны при статической генерации!

Данные скрипты являются временным, надеюсь, решением. После появления официальной поддержки их нужно будет отключить!

### Как это работает:
Статичная сборка создает в каждом `.html` файле некий набор данных `window.__DATA__`

Следом подключается `toc` файл и его содержимое присоединяется к `window.__DATA__.data.toc`

Дальше стартует приложение, написанное на `react`, которое использует `window.__DATA__` для восстановления своего состояния

`window.__DATA__` это `props` в понимании `react`, а значит можно прокинуть недостающие пропсы.
Скрипты вклиниваются до запуска `react` приложения и изменяют `window.__DATA__`


### Какие фичи поддерживаются:
- Чистые ссылки без `index`, `index.html` и `.html` - `feature-clean-links.js`
- Хлебные крошки - `feature-breadcrumbs.js`
- Фидбэк от пользователей (like/dislike) - `feature-feedback.js`
- Добавление кнопки на редактирование статьи (это просто ссылка, обычно в github) - `feature-vcs.js`

### Как запустить:

Добавить в `.yfm`
```yaml
resources:
  script:
    - _assets/script/feature-base.js
    - _assets/script/feature-clean-links.js
    - _assets/script/feature-breadcrumbs.js
    - _assets/script/feature-feedback.js
    - _assets/script/feature-vcs.js
```

Добавить в `toc.yaml`
```yaml
title: ...
href: ...
features:
  breadcrumbs: true
  feedback: true
  vcs:
    url: https://example.ru/-/blob/main/docs/{path}
  cleanLinks: true
```

Собрать статическую документацию
```bash
yfm -i docs -o build --allow-custom-resources
```

Важно: если используете `feature-clean-links.js` лучше подключать его сразу после `feature-base.js`, т.к. он изменяет все ссылки

Если есть потребность в сборке под разное окружение, то `presets.yaml` не подойдет, т.к. он просто не обработает свойство `features` в `toc.yaml`
Однако можно выборочно подключить нужные ресурсы через `yfm`, тем самым подключив только нужные скрипты.

```bash
yfm -i docs -o build \
  --resource script:_assets/script/feature-base.js \
  --resource script:_assets/script/feature-clean-lin.js \
  #и т.д
```

### Настройки фич

#### Чистые ссылки

```yaml
features:
  cleanLinks: true
  # или
  cleanLinks:
    ext: boolean # удаляет расширение html
    index: boolean # удаляет так же index
```

#### Хлебные крошки

```yaml
title: ...
href: ...
features:
  breadcrumbs: boolean
  #или
  breadcrumbs:
    tocAsRoot: boolean #если true, то корнем будет сам toc (title + href)
```

#### Фидбэк от пользователя

```yaml
features:
  feedback: boolean
  # или
  feedback:
    sendUrl: https://example.com/feedback # Адрес для отправки данных методом POST
```

Формат отправляемых данных:

```js
{
    route: string // Адрес страницы
    type: string // Тип фидбэка (like, dislike, indeterminate)
    comment?: string // комментарий
    answers?: string[] // или один из ответов
}
```

#### Редактирование (Vcs)

```yaml
features:
  vcs:
    url: https://example.com/{path}/edit # {path} подставляется автоматически и содержит путь к странице + .md
```


 
