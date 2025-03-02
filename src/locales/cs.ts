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
        }
    },
    global: {
        api_key_input_placeholder: "API Klíč",
        processing_button_text: "Zpracovává se...",
        bad_api_key_alert: "Špatný API klíč"
    }
};

export default cs;