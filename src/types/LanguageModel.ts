
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
            total_pastes_text: string;
            total_short_urls_text: string;
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
        },
        portable_image: {
            drag_and_drop_text: string;
            button_text: string;
            image_uploaded_alert: string;
        },
        user_finder: {
            title: string;
            subtitle: string;
            input_placeholder: string;
            button_text: string;
            no_user_found_error: string;
            empty_field_error: string;
        },
        image_viewer: {
            uploaded_by: string;
            uploaded_on: string;
            download_button_text: string;
            copy_button_text: string;
            report_button_text: string;
            download_alert: string;
        },
        image_finder: {
            title: string;
            subtitle: string;
            input_placeholder: string;
            button_text: string;
            no_image_found_error: string;
            empty_field_error: string;
        }
    },
    global: {
        api_key_input_placeholder: string;
        processing_button_text: string;
        bad_api_key_alert: string;
    },
    toasts: {
        error: {
            changing_theme: string;
            change_theme: string;
        },
        success: {
            copied_to_clipboard: string;
            change_theme: string;
            language_changed: string;
        },
    },
    comp: {
        sidebar: {
            home: string;
            images: string;
            pastes: string;
            short_urls: string;
            settings: string;
            profile: string;
            logout: string;
        }
    }
}