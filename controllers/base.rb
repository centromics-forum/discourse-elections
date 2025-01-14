module DiscourseElections
  class BaseController < ::ApplicationController
    rescue_from StandardError, with: :handle_exception

    def ensure_is_elections_admin
      unless current_user && current_user.is_elections_admin?
        raise Discourse::InvalidAccess.new
      end
    end

    def ensure_is_elections_category
      return false unless params.include?(:category_id)

      category = Category.find(params[:category_id])

      unless category.custom_fields["for_elections"]
        raise StandardError.new I18n.t("election.errors.category_not_enabled")
      end
    end

    def render_result(result = {})
      #if result.present?
        pp "DDDDDDDDDDDDDDDDDDD #{result}"
        if result.present? && result[:error_message].present?
          render json: failed_json.merge(message: result[:error_message])
        else
          render json: success_json.merge(result)
        end
      # else 
      #   render json: failed_json.merge(message: I18n.t("election.errors.missing_result"))
      # end
    rescue StandardError => e
      puts e.message
      puts e.backtrace.join("\n") if Rails.env.development?
      raise
    end

    private

    def handle_exception(error)
      logger.error(error)
      render json: { error: error.message }, status: :internal_server_error
    end
  end
end
