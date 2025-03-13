import LanguageModel from "@/types/LanguageModel";

const cs: LanguageModel = {
    pages: {
        login: {
            title: "XAP3Y - Space",
            under_title: "Přihlaste se pro pokračování",
            email_placeholder: "Emailová adresa",
            password_placeholder: "Heslo",
            no_account: "Nemáte účet?",
            signup_text: "Zaregistrovat se",
            button_text: "Přihlásit se",
            forgot_password: "Zapomněli jste heslo?",
            user_not_found: "Uživatel nebyl nalezen",
            wrong_password: "Špatné heslo",
            short_password: "Heslo je příliš krátké",
            success: "Přihlášení proběhlo úspěšně"
        },
        user: {
            total_images_text: "Celkem obrázků",
            total_pastes_text: "Celkem pastů",
            total_short_urls_text: "Celkem zkrácených URL",
            joined_date_text: "Datum registrace",
            storage_used_text: "Využité úložiště",
            invited_by_text: "Pozván od"
        },
        portable_url: {
            title: "Zkracovač URL",
            original_url_placeholder: "Původní URL",
            button_text: "Zkrátit URL"
        },
        portable_paste: {
            title: "Paste Creator",
            title_input_placeholder: "Nadpis",
            paste_input_placeholder: "Kontent",
            button_text: "Vytvořit Haste",
            invalid_paste_length_alert: "Kontent je příliš krátký!",
            invalid_title_length_alert: "Nadpis je příliš krátký!",
            paste_created_alert: "Haste Vytvořen",
            view_paste_text: "View created paste:"
        },
        portable_image: {
            drag_and_drop_text: "Přetáhněte obrázek sem",
            button_text: "Nahrát Obrázek",
            image_uploaded_alert: "Obrázek byl úspěšně nahrán"
        },
        user_finder: {
            title: "Vyhledat Uživatele",
            subtitle: "Najít uživatele podle jeho uživatelského jména nebo UID",
            input_placeholder: "uživatelského jméno | UID",
            button_text: "Najít Uživatele",
            no_user_found_error: "Uživatel nebyl nalezen",
            empty_field_error: "Prosím zadejte uživatelské jméno nebo UID"
        },
        image_viewer: {
            uploaded_by: "Nahrál",
            uploaded_on: "Nahráno",
            download_button_text: "Stáhnout",
            copy_button_text: "Kopírovat",
            report_button_text: "Nahlásit",
            download_alert: "Stahování..."
        }
    },
    global: {
        api_key_input_placeholder: "API Klíč",
        processing_button_text: "Zpracovává se...",
        bad_api_key_alert: "Špatný API klíč"
    },
    toasts: {
        error: {
            changing_theme: "Přepínání tématu...",
            change_theme: "Nepodařilo se změnit téma"
        },
        success: {
            copied_to_clipboard: "Zkopírováno do schránky",
            change_theme: "Téma změněno",
            language_changed: "Jazyk změněn na: "
        },
    },
    comp: {
        sidebar: {
            home: "Domů",
            images: "Obrázky",
            pastes: "Pastes",
            short_urls: "Zkrácené URL",
            settings: "Nastavení",
            profile: "Profil",
            logout: "Odhlásit se"
        }
    }
};

export default cs;