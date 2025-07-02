
Опубликованные расширения позволяют активировать функционал, которые доступны только в облаке diplodoc, но не доступны при статической генерации!

Данные расширения являются временным решением. После появления официальной поддержки их нужно будет отключить!

### Расширения:
- `clean-links` - Чистые ссылки без `index`, `index.html` и `.html`
- `breadcrumbs` - Хлебные крошки
- `feedback-control` - Кнопки like/dislike в статьях с возможностью отправки на указанный сервер
- `vcs-control` - Кнопка на открытие статьи в режиме редактирования в любой vcs

### Как запустить:

Скопировать расширения из папки `dist` в корень своего проекта, например в папку `extensions`

Вся работа по настройке происходит в файле `.yfm`

Подключить расширения:
```yaml
extensions:
  - './extensions/vcs-control'
  - './extensions/feedback-control'
  - './extensions/breadcrumbs'
  - './extensions/clean-links'
```

Активировать расширения:
```yaml

vcsControl:
  url: 'https://git.example.ru/{path}'
  type: 'github'

feedbackControl: true

breadcrumbs: true

cleanLinks: true
```

Собрать статическую документацию
```bash
yfm -i docs -o build <ваши доп.параметры>
```

Важно: если используете `clean-links`, то следует подключать его последним!

Если есть необходимость настройки расширений под разное окружение, то используйте альтернативные файлы `.yfm`

### Настройки расширений

#### Чистые ссылки (clean-links)

```yaml
cleanLinks: true
# или
cleanLinks:
  ext: boolean # удаляет расширение html (true по умолчанию)
  index: boolean # удаляет так же index (true по умолчанию)
```

#### Хлебные крошки (breadcrumbs)

```yaml

breadcrumbs: true
#или
breadcrumbs:
  tocAsRoot: boolean # если true, то корнем будет сам toc (title + href) (true по умолчанию)
  appendLabeled: boolean # если true, то будут добавлены labeled элементы не содержащие ссылок (false по умолчанию)
```

#### like/dislike от пользователя (feedback-control)

```yaml
feedbackControl: true
# или
feedbackControl:
  endpoint: https://example.com/feedback # Адрес для отправки данных методом POST
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

Так же результат фидбека сохраняется у пользователя в `localStorage`.

#### Редактирование (vcs-control)

```yaml
vcsControl:
  url: https://example.com/{path}/edit # {path} подставляется автоматически и содержит путь к странице + .md
  type: 'github' # пока что доступен один из вариантов: github и arcanum. В целом это только визуальное оформление (иконки + подсказка)
```


 
