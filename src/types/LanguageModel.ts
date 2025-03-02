
export default interface LanguageModel {
    pages: {
        login: {
            title: string;
            under_title: string;
            email_placeholder: string;
            password_placeholder: string;
            no_account: string;
            signup_text: string;
            button_text: string;
            forgot_password: string;
            user_not_found: string;
            wrong_password: string;
            short_password: string;
            success: string;
        },
        user: {
            total_images_text: string;
            joined_date_text: string;
            storage_used_text: string;
            invited_by_text: string;
        },
        portable_url: {
            title: string;
            original_url_placeholder: string;
            button_text: string;
        },
        portable_paste: {
            title: string;
            title_input_placeholder: string;
            paste_input_placeholder: string;
            button_text: string;
            invalid_paste_length_alert: string;
            invalid_title_length_alert: string;
            paste_created_alert: string;
            view_paste_text: string;
        }
    },
    global: {
        api_key_input_placeholder: string;
        processing_button_text: string;
        bad_api_key_alert: string;
    }
}