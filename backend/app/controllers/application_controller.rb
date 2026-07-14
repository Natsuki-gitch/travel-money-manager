class ApplicationController < ActionController::API
  include Devise::Controllers::Helpers

  rescue_from ActiveRecord::RecordNotFound do
    render json: { error: "not found" }, status: :not_found
  end
end
