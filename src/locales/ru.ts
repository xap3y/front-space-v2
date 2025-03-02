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
            title_input_placeholder: "[RU] Title",
            paste_input_placeholder: "[RU] Paste",
            button_text: "[RU] Create Paste",
            invalid_paste_length_alert: "[RU] Invalid Paste length!",
            invalid_title_length_alert: "[RU] Invalid Title length!",
            paste_created_alert: "[RU] Paste created",
            view_paste_text: "[RU] View created paste:"
        }
    },
    global: {
        api_key_input_placeholder: "API ключ",
        processing_button_text: "[RU] Processing...",
        bad_api_key_alert: "[RU] Invalid API Key"
    }
};

export default ru;