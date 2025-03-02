import LanguageModel from "@/types/LanguageModel";

const en: LanguageModel = {
    pages: {
        login: {
            title: "XAP3Y - Space",
            under_title: "Sign in to continue",
            email_placeholder: "Email address",
            password_placeholder: "Password",
            no_account: "Don't have an account?",
            signup_text: "Sign up",
            button_text: "Sign In",
            forgot_password: "Forgot password?",
            user_not_found: "User not found",
            wrong_password: "Wrong password",
            short_password: "Password is too short",
            success: "Login successful"
        },
        user: {
            total_images_text: "Total images",
            joined_date_text: "Joined date",
            storage_used_text: "Storage used",
            invited_by_text: "Invited by"
        },
        portable_url: {
            title: "URL Shortener",
            original_url_placeholder: "Original URL",
            button_text: "Short URL"
        },
        portable_paste: {
            title: "Paste Creator",
            title_input_placeholder: "Title",
            paste_input_placeholder: "Paste",
            button_text: "Create Paste",
            invalid_paste_length_alert: "Invalid Paste length!",
            invalid_title_length_alert: "Invalid Title length!",
            paste_created_alert: "Paste created",
            view_paste_text: "View created paste:"
        }
    },
    global: {
        api_key_input_placeholder: "API Key",
        processing_button_text: "Processing...",
        bad_api_key_alert: "Invalid API Key"
    }
};

export default en;