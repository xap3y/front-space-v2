import LanguageModel from "@/types/LanguageModel";

// Russian (ru) language pack
const ru: LanguageModel = {
    pages: {
        login: {
            title: "XAP3Y - Space",
            under_title: "Войдите, чтобы продолжить",
            email_placeholder: "Адрес электронной почты",
            password_placeholder: "Пароль",
            no_account: "У вас нет учетной записи?",
            signup_text: "Зарегистрироваться",
            button_text: "Войти",
            forgot_password: "Забыли пароль?",
            user_not_found: "Пользователь не найден",
            wrong_password: "Неправильный пароль",
            short_password: "Пароль слишком короткий",
            success: "Вход выполнен успешно"
        },
        user: {
            total_images_text: "Всего изображений",
            total_pastes_text: "Всего паст",
            total_short_urls_text: "Всего сокращенных URL",
            joined_date_text: "Дата регистрации",
            storage_used_text: "Используемое хранилище",
            invited_by_text: "Пригласил"
        },
        portable_url: {
            title: "Сокращатель URL",
            original_url_placeholder: "Оригинальный URL",
            button_text: "Сократить URL"
        },
        portable_paste: {
            title: "[RU] Paste Creator",
            title_input_placeholder: "Заголовок",
            paste_input_placeholder: "[RU] Paste",
            button_text: "[RU] Create Paste",
            invalid_paste_length_alert: "[RU] Invalid Paste length!",
            invalid_title_length_alert: "Неверная длина заголовка!",
            paste_created_alert: "[RU] Paste created",
            view_paste_text: "[RU] View created paste:"
        },
        portable_image: {
            drag_and_drop_text: "Перетащите изображение сюда или нажмите, чтобы выбрать",
            button_text: "Загрузить изображение",
            image_uploaded_alert: "Изображение успешно загружено"
        },
        user_finder: {
            title: "Поиск пользователя",
            subtitle: "Найти пользователя по его имени пользователя или UID",
            input_placeholder: "Имя пользователя | UID",
            button_text: "Найти пользователя",
            no_user_found_error: "Пользователь не найден",
            empty_field_error: "Введите имя пользователя или UID"
        },
        image_viewer: {
            uploaded_by: "NULL",
            uploaded_on: "NULL",
            download_button_text: "NULL",
            copy_button_text: "NULL",
            report_button_text: "NULL",
            download_alert: "NULL"
        }
    },
    global: {
        api_key_input_placeholder: "API ключ",
        processing_button_text: "Обработка...",
        bad_api_key_alert: "Неверный API ключ"
    },
    toasts: {
        error: {
            changing_theme: "Переключение темы...",
            change_theme: "Не удалось изменить тему"
        },
        success: {
            copied_to_clipboard: "Скопировано в буфер обмена",
            change_theme: "Тема изменена",
            language_changed: "Язык изменен на: "
        },
    },
    comp: {
        sidebar: {
            home: "Главная",
            images: "Изображения",
            pastes: "Пасты",
            short_urls: "Сократить URL",
            settings: "Настройки",
            profile: "Профиль",
            logout: "Выйти"
        }
    }
};

export default ru;