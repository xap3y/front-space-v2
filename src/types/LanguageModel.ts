
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
        register: {
            title: string;
            under_title: string;
            confirm_password_placeholder: string;
            invite_code_placeholder: string;
            button_text: string;
            already_have_account: string;
            login_text: string;
            invalid_email_alert: string;
            password_too_short_alert: string;
            passwords_do_not_match_alert: string;
            invalid_invite_code_alert: string;
            success_alert: string;
            failed_alert: string;
            email_already_exists_alert: string;
            username_already_exists_alert: string;
        },
        user: {
            total_images_text: string;
            total_pastes_text: string;
            total_short_urls_text: string;
            joined_date_text: string;
            storage_used_text: string;
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
            password_required: string;
            password_placeholder: string;
            view_image_button_placeholder: string;
        },
        image_finder: {
            title: string;
            subtitle: string;
            input_placeholder: string;
            button_text: string;
            no_image_found_error: string;
            empty_field_error: string;
        },
        profile: {
            title: string;
        }
    },
    global: {
        api_key_input_placeholder: string;
        processing_button_text: string;
        bad_api_key_alert: string;
        invited_by_text: string;
        storage_used_text: string;
        total_images_text: string;
        total_pastes_text: string;
        total_short_urls_text: string;
        joined_date_text: string;
        click_to_show: string;
        click_to_hide: string;
        click_to_copy: string;
        member_since: string;
        click_to_edit: string;
        click_to_save: string;
        click_to_delete: string;
        disabled_text: string;
        not_connected_text: string;
    },
    toasts: {
        error: {
            changing_theme: string;
            change_theme: string;
            email_change: string;
            invalid_password: string;
        },
        success: {
            copied_to_clipboard: string;
            change_theme: string;
            language_changed: string;
            email_change: string;
            password: string;
        },
        loading: {
            fetching_image: string;
        }
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