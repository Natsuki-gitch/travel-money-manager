class Users::SessionsController < Devise::SessionsController
  respond_to :json

  # verify_signed_out_user はセッションベースの判定で、JWT(セッション無効化済み)とは
  # 噛み合わないため使わない。実際のトークン失効は warden-jwt_auth の
  # RevocationManager ミドルウェアが応答後に自動で行う。
  skip_before_action :verify_signed_out_user, only: [:destroy]

  def destroy
    if current_user
      head :no_content
    else
      head :unauthorized
    end
  end

  private

  def respond_with(resource, _opts = {})
    render json: { user: { id: resource.id, name: resource.name, email: resource.email } }, status: :ok
  end
end
