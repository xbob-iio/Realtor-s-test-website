import Link from 'next/link';

import type { LegalSection } from '@/components/legal/legal-page';

import { ContactLine, type LegalContext } from './common';

export function cookieSections(context: LegalContext): LegalSection[] {
  return [
    {
      id: 'what',
      title: 'Что такое cookies',
      content: (
        <p>
          Cookies — небольшие текстовые файлы, которые сайт сохраняет в браузере. Они помогают сайту работать,
          запоминать ваш выбор и понимать, как им пользуются. Похожим образом работает локальное хранилище
          браузера (localStorage).
        </p>
      ),
    },
    {
      id: 'categories',
      title: 'Какие cookies использует сайт',
      content: (
        <>
          <p>
            Мы делим cookies на четыре категории. Необходимые работают всегда, остальные — только после вашего
            согласия.
          </p>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Категория</th>
                  <th>Назначение</th>
                  <th>Срок</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>cookie_consent</code>
                  </td>
                  <td>Необходимые</td>
                  <td>Хранит ваш выбор настроек cookies</td>
                  <td>180 дней</td>
                </tr>
                <tr>
                  <td>
                    <code>__Host-doma_session</code>
                  </td>
                  <td>Необходимые</td>
                  <td>Сессия администратора — только в панели управления сайтом</td>
                  <td>до 7 дней</td>
                </tr>
                <tr>
                  <td>
                    <code>recently-viewed</code> (localStorage)
                  </td>
                  <td>Функциональные</td>
                  <td>Список недавно просмотренных квартир. Хранится только в вашем браузере</td>
                  <td>до очистки</td>
                </tr>
                <tr>
                  <td>
                    <code>_ga</code>, <code>_ga_*</code>
                  </td>
                  <td>Аналитические</td>
                  <td>
                    Google Analytics — обобщённая статистика посещений (если подключена владельцем сайта)
                  </td>
                  <td>до 2 лет</td>
                </tr>
                <tr>
                  <td>
                    <code>_fbp</code>
                  </td>
                  <td>Маркетинговые</td>
                  <td>Meta Pixel — оценка эффективности рекламы (если подключен владельцем сайта)</td>
                  <td>90 дней</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: 'consent',
      title: 'Согласие и его отзыв',
      content: (
        <>
          <p>
            При первом посещении сайт показывает баннер, где можно принять все cookies, оставить только
            необходимые или выбрать категории вручную. До вашего выбора необязательные cookies и скрипты
            аналитики не загружаются.
          </p>
          <p>
            Изменить решение можно в любой момент по ссылке «Настройки cookies» внизу любой страницы. При
            отзыве согласия мы удаляем соответствующие cookies, доступные сайту.
          </p>
        </>
      ),
    },
    {
      id: 'browser',
      title: 'Настройки браузера',
      content: (
        <p>
          Вы также можете запретить или удалить cookies в настройках браузера. Учтите, что без необходимых
          cookies некоторые функции сайта могут работать некорректно.
        </p>
      ),
    },
    {
      id: 'more',
      title: 'Дополнительная информация',
      content: (
        <>
          <p>
            Как мы обрабатываем персональные данные, описано в{' '}
            <Link href="/privacy-policy">Политике конфиденциальности</Link>. По вопросам о cookies
            обращайтесь:
          </p>
          <ContactLine context={context} />
        </>
      ),
    },
  ];
}
