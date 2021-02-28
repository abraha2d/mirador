"""mirador URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.auth.decorators import login_required
from django.urls import include, path
from django.views.generic import TemplateView

from rest_framework import routers
import debug_toolbar

from camera.api import views as camera_api
from storage.api import views as storage_api

admin.site.site_title = "Mirador"
admin.site.site_header = "Mirador"
admin.site.index_title = "Configuration"

router = routers.DefaultRouter()
router.register("cameras", camera_api.CameraViewSet)
router.register("videos", storage_api.VideoViewSet)

urlpatterns = [
    path("api/", include(router.urls)),
    path("api/auth/", include("rest_framework.urls", namespace="rest_framework")),
    path("accounts/", include("django.contrib.auth.urls")),
    path("admin/", admin.site.urls),
    path("__debug__/", include(debug_toolbar.urls)),
    path(
        "",
        login_required(
            TemplateView.as_view(template_name="index.html"), login_url="/admin/login/"
        ),
        name="index",
    ),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
