module DiscourseElections
  class NominationController < BaseController
    before_action :ensure_logged_in
    before_action :ensure_is_elections_admin, only: [:set_by_username]


    # @param [integer] topic_id
    # @param [array] nominations
    # [
    # {
    #   username: "user1"
    #   description: 'description1',
    # },
    # {
    #   username: "user2"
    #   description: 'description2',
    # }
    #]
    def set_by_username
      params.require(:topic_id)
      nominations_usernames = params.require(:nominations_usernames)

      # usernames = params[:usernames].blank? ? [] : [*params[:usernames]]
      # usernames.map { |u| u.strip! }
      nominations_usernames_arr = []
      nominations_usernames.permit!
      nominations_usernames.each { |n| nominations_usernames_arr << n[1]&.to_h }
      #nominations_usernames.uniq!

      topic = Topic.find(params[:topic_id])
      if topic.election_status != Topic.election_statuses[:nomination] && nominations_usernames_arr.length < 2
        raise StandardError.new I18n.t('election.errors.more_nominations')
      end

      result = DiscourseElections::Nomination.set_by_username(params[:topic_id], nominations_usernames_arr)

      if result.is_a?(Array)
        render_result({ nominations_usernames: result })
      else 
        render_result({ error_message: result })
      end
    rescue StandardError => e
      puts e.message
      puts e.backtrace.join("\n") if Rails.env.development?
      #render_result({ error_message: e.message })
      raise
    end

    def add
      params.require(:topic_id)

      user = current_user
      min_trust = SiteSetting.elections_min_trust_to_self_nominate.to_i

      if !user || user.anonymous?
        result = { error_message: I18n.t('election.errors.only_named_user_can_self_nominate') }
      elsif !user.admin && user.trust_level < min_trust
        result = { error_message: I18n.t('election.errors.insufficient_trust_to_self_nominate', level: min_trust) }
      else
        DiscourseElections::Nomination.add_user(params[:topic_id], user.id)
        result = { success: true }
      end

      render_result(result)
    end

    def remove
      params.require(:topic_id)

      DiscourseElections::Nomination.remove_user(params[:topic_id], current_user.id)

      render_result
    end
  end
end
